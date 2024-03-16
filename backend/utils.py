
###################
###### Utils ######
###################

import numpy as np
from pyproj import Geod
from shapely.geometry import Point, LineString, MultiLineString, Point, CAP_STYLE
from shapely import ops
from shapely.ops import unary_union, nearest_points
import pandas as pd
import geopandas as gpd
import momepy
import networkx as nx


from parameters import(
    train_s,
    train_t,
    route_s,
    train_intensity,
    carbon_intensity_electricity, 
    sea_threshold,
    nb_pts
)

# Web
import requests



def flatten_list_of_tuples(lst):
    # We reverse the geometry so the latitude are written before the longitude (Overpass API nomenclature)
    return [item for tup in lst for item in tup[::-1]]


# Not really accurate but good enough and fast for some purposes
def kilometer_to_degree(km):
    c = 180 / (np.pi * 6371)  # Earth radius (km)
    return c * km

def great_circle_geometry(dep, arr, nb=nb_pts):
    """
    Create the great circle geometry with pyproj
    parameters:
        - nb : number of points
        - dep, arr : departure and arrival
    return:
        - shapely geometry (Linestring)
        - Geodesic distance in km
    """
    # projection
    geod = Geod(ellps="WGS84")
    # returns a list of longitude/latitude pairs describing npts equally spaced
    # intermediate points along the geodesic between the initial and terminus points.
    r = geod.inv_intermediate(
        lon1=float(dep[0]),
        lat1=float(dep[1]),
        lon2=float(arr[0]),
        lat2=float(arr[1]),
        npts=nb,
        initial_idx=0,
        terminus_idx=0,
    )

    # Create the geometry
    # Displaying results over the antimeridian
    if abs(min(r.lons) - max(r.lons)) > 180:
        # Then the other way is faster, we add 360° to the destination with neg lons
        l = [
            [lon, lat]
            for lon, lat in zip(
                [lon + 360 if lon < 0 else lon for lon in r.lons], r.lats
            )
        ]
    else:
        l = [[lon, lat] for lon, lat in zip(r.lons, r.lats)]

    # Return geometry and distance
    return LineString(l), r.dist / 1e3  # in km




def filter_countries_world(gdf, method, th=sea_threshold):
    """
    Filter train path by countries (train_intensity.geojson)
    parameters:
        - gdf : train geometry in geoserie
        - mode : train / ecar
        - th : threshold to remove unmatched gaps between countries that are too small (km)
    return:
        - Geodataframe of train path by countries
    """
    if method == 'train':
        iso = "ISO2"
        EF = "EF_tot"
        data = train_intensity
    else : #ecar
        iso = 'Code'
        EF = 'mix'
        data = carbon_intensity_electricity
    # Make the split by geometry
    gdf.name = "geometry"
    res = gpd.overlay(
        gpd.GeoDataFrame(gdf, geometry="geometry", crs="epsg:4326"),
        data,
        how="intersection",
    )
    diff = gpd.overlay(
        gpd.GeoDataFrame(gdf, geometry="geometry", crs="epsg:4326"),
        data,
        how="difference",
    )
    # Check if the unmatched data is significant
    if diff.length.sum() > kilometer_to_degree(th):
        print("Sea detected")
        # In case we have bridges / tunnels across sea:
        # Distinction depending on linestring / multilinestring
        if diff.geometry[0].geom_type == "MultiLineString":
            #  print('MultiLinestring')
            diff_2 = gpd.GeoDataFrame(list(diff.geometry.values[0].geoms))
        else:
            # print("Linestring")
            diff_2 = gpd.GeoDataFrame(list(diff.geometry.values))
        diff_2.columns = ["geometry"]
        diff_2 = diff_2.set_geometry("geometry", crs="epsg:4326")
        # Filter depending is the gap is long enough to be taken into account and join with nearest country
        test = diff_2[diff_2.length > kilometer_to_degree(th)].sjoin_nearest(
            data, how="left"
        )
        # Aggregation per country and combining geometries
        u = (
            pd.concat([res.explode(), test.explode()])
            .groupby(iso)
            .agg(
                NAME=("NAME", lambda x: x.iloc[0]),
                EF_tot=(EF, lambda x: x.iloc[0]),
                geometry=(
                    "geometry",
                    lambda x: ops.linemerge(MultiLineString(x.values)),
                ),
            )
        )
    else:
        u = (
            res.explode()
            .groupby(iso)
            .agg(
                NAME=("NAME", lambda x: x.iloc[0]),
                EF_tot=(EF, lambda x: x.iloc[0]),
                geometry=(
                    "geometry",
                    lambda x: ops.linemerge(MultiLineString(x.values)),
                ),
            )
        )
    # Rendering result
    res = gpd.GeoDataFrame(u, geometry="geometry", crs="epsg:4326").reset_index()
    return res

def extend_search(tag1, tag2, perims):
    """
    Function to use when the train path is not found directly by the API.
    We search for nearby coordinates and request it again.
    parameters:
        - tag1, tag2 : list or tuple like with coordinates (lon, lat)
        - perims : list-like ; perimeters to search for with overpass API
    return:
        - gdf (geoseries)
        - train (bool)
    """
    # We extend the search progressively
    for perim in perims:
        # Departure
        tag1_new = find_nearest(tag1[0], tag1[1], perim)
        if tag1_new != False:
            # Then we found a better place, we can stop the loop
            break
    # Maybe here try to check if the API is not already working
    if tag1_new == False:
        # Then we will find nothing
        gdf = pd.DataFrame()
        train = False
        train_dist = None
    # return None, False
    else:
        # We can retry the API
        gdf, train, train_dist = find_train(tag1_new, tag2)
        if train == False:
            # We can change tag2
            for perim in perims:  # Could be up to 10k  ~ size of Bdx
                # Arrival
                tag2_new = find_nearest(tag2[0], tag2[1], perim)
                if tag2_new != False:
                    break

            # Verify than we wan try to request the API again
            if (tag1_new != False) & (tag2_new != False):
                gdf, train, train_dist = find_train(tag1_new, tag2_new)

    return gdf, train, train_dist


def validate_geom(tag1, tag2, geom, th):
    """
    Verify that the departure and arrival of geometries are close enough to the ones requested
    parameters:
        - tag1, tag2 : requested coordinates
        - geom : shapely geometry answered
        - th : threshold (km) for which we reject the geometry
    return:
        boolean (True valid geometry / False wrong geometry)
    """
    geod = Geod(ellps="WGS84")
    # To compute distances
    # Creating geometries for departure
    ecart = LineString([tag1, list(geom.coords)[0]])
    # Maybe geod can compute length between 2 points directly
    if geod.geometry_length(ecart) / 1e3 > th:
        print("Departure is not valid")
        return False
    # Arrival
    ecart = LineString([tag2, list(geom.coords)[-1]])
    # Maybe geod can compute length between 2 points directly
    if geod.geometry_length(ecart) / 1e3 > th:
        print("Arrival is not valid")
        return False
    # If we arrive here both dep and arr where validated
    return True

###################
###### Finders ####
###################


def find_nearest(lon, lat, perim):
    """
    This function find the nearest node for train raiway in the OSM network using Overpass API
    parameters:
        - lon, lat : coordinates in degree of the point
        - perim : perimeters (m) to look around
    return:
        - new coordinates(lat, lon)
    """
    # Extend the area around the point
    buff = list(Point(lon, lat).buffer(kilometer_to_degree(perim)).exterior.coords)
    # Request Overpass API turbo data :
    l = flatten_list_of_tuples(buff)

    # Overpass API nomenclature - filter by polygon
    st = ""
    for k in l:
        st += str(k) + " "

    # Prepare the request
    url = "http://overpass-api.de/api/interpreter"  # To avoid the natural space at the end
    query = (
        '[out:json][timeout:300];(way(poly : "'
        + st[:-1]
        + '")["railway"="rail"];);out geom;'
    )  # ;convert item ::=::,::geom=geom(),_osm_type=type()

    # Make request
    response = requests.get(url, params={"data": query})

    # if response.status_code == 200: not working, looking at size of elements also
    if (response.status_code == 200) & (len(response.json()["elements"]) > 0):
        # Extract the first point coordinates we could found
        new_point = (
            pd.json_normalize(response.json()["elements"][0]).loc[0].geometry[0]
        )  # .columns
        # Return lon, lat
        return (new_point["lon"], new_point["lat"])
    else:
        # Couldn't find a node
        return False
    

def find_train(tag1, tag2, method = 'signal'):
    """
    Find train path between 2 points. Can use ntag API or signal.
    parameters:
        - tag1, tag2 : list or tuple like (lon, lat)
        - method : signal / trainmap
    return:
        - gdf, a geoserie with the path geometry / None if failure
        - train, boolean
    """
    # format lon, lat
    # Build the request url
    if method == 'trainmap' :
    # trainmap
        url = (
            f"https://trainmap.ntag.fr/api/route?dep={tag1[0]},{tag1[1]}&arr={tag2[0]},{tag2[1]}&simplify="
            + train_t
        )  # 1 to simplify it
    else : 
    # signal
        url = (
            f'https://signal.eu.org/osm/eu/route/v1/train/{tag1[0]},{tag1[1]};{tag2[0]},{tag2[1]}?overview='
            + train_s
            + "&geometries=geojson"
        )# simplified
    # Send the GET request
    # import time
    # s = time.time()
    response = requests.get(url)
    # print(time.time() - s)

    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        print("Path retrieved!")
        if method == 'trainmap' :
        # Store data in a geodataserie - trainmap
            gdf = gpd.GeoSeries(
                LineString(response.json()["geometry"]["coordinates"][0]), crs="epsg:4326"
            )
        # geom = LineString(response.json()['geometry']['coordinates'][0])
        # geod = Geod(ellps="WGS84")
        # print('Train intial', geod.geometry_length(geom) / 1e3)
        else :
            train_dist = response.json()["routes"][0]['distance'] / 1e3 #km
        # Store data - signal
            gdf = gpd.GeoSeries(
                LineString(response.json()["routes"][0]["geometry"]["coordinates"]), crs="epsg:4326"
            )  
        train = True
    else:
        # Error message
        print(f"Failed to retrieve data. Status code: {response.status_code}")
        gdf, train, train_dist = pd.DataFrame(), False, 0
        # We will try to request again with overpass
    return gdf, train, train_dist


def find_route(tag1, tag2):
    """
    Find road path between 2 points
    parameters:
        - tag1, tag2 : list or tuple like ; (lon, lat)
    return:
        - geom_route : shapely geometry linestring
        - route_dist : float, distance in km
        - route : boolean
    """
    ### Route OSRM - create a separate function
    url = (
        "http://router.project-osrm.org/route/v1/driving/"
        + str(tag1[0])
        + ","
        + str(tag1[1])
        + ";"
        + str(tag2[0])
        + ","
        + str(tag2[1])
        + "?overview="
        + route_s
        + "&geometries=geojson"
    )
    response = requests.get(url)
    if response.status_code == 200:
        geom = response.json()["routes"][0]["geometry"]
        geom_route = LineString(geom["coordinates"])  # convert.decode_polyline(geom)
        route_dist = response.json()["routes"][0]["distance"] / 1e3  # In km
        route = True
    else:
        geom_route, route_dist, route = None, None, False

    return geom_route, route_dist, route

def find_bicycle(tag1, tag2):
    ### Openrouteservie
    api_key = "5b3ce3597851110001cf62484e73101571fe41d0bfc8f8454030eb48"
    url = (
    "https://api.openrouteservice.org/v2/directions/cycling-regular?api_key="
    + api_key
    + "&start="
    + str(tag1[0])
    + ","
    + str(tag1[1])
    + "&end="
    + str(tag2[0])
    + ","
    + str(tag2[1])
)
    response = requests.get(url)
    if response.status_code == 200:
        geom = response.json()["features"][0]["geometry"]
        geom_route = LineString(geom["coordinates"]).simplify(.05, preserve_topology=False)  # convert.decode_polyline(geom)
        route = True
        route_dist = response.json()["features"][0]["properties"]["summary"]['distance'] / 1e3 #km
        print('Bicycle length', round(route_dist, 1))
    else:
        geom_route, route, route_idst = None, False, None

    return geom_route, route, route_dist

#CREATE FERRY ROUTE

def create_cost(world = train_intensity, buffer = 0 ):
    '''
    world is the dataset from geopandas, already loaded for trains and ecar
    Return a list of geometries as well as the overall multi geometry
    '''
    coast_lines = unary_union(world.buffer(buffer, cap_style=CAP_STYLE.square).geometry).boundary
    #To shapely list
    coast_exp = list(gpd.GeoSeries(coast_lines).explode().values)
    return coast_lines, coast_exp

def get_line_coast(point, coast) :
    '''
    coast the full shapely geometry
    '''
    #Get linestring to get to the see
    nearest_point_on_line = nearest_points(Point(point), coast)[1]

    # Create a new linestring connecting the two points
    new_linestring = LineString([Point(point), nearest_point_on_line])
    #print(list(new_linestring.coords))
    
    return new_linestring

def extend_line(line, additional_length = 0.001): #, start=True
    # Define the additional length you want to add to the LineString
    #additional_length = 0.2

    # Get the coordinates of the first and last points of the LineString
    start_point = line.coords[0]
    end_point = line.coords[-1]

    # # Calculate the direction vector from the second point to the first point
    # direction_vector_start = (
    #     line.coords[1][0] - start_point[0],
    #     line.coords[1][1] - start_point[1]
    # )

    # # Calculate the new start point by extending the first point along the direction vector
    # new_start_point = (start_point[0] - direction_vector_start[0] * additional_length,
    #                 start_point[1] - direction_vector_start[1] * additional_length)

    # Calculate the direction vector from the last point to the second-to-last point
    direction_vector_end = (
        end_point[0] - line.coords[-2][0],
        end_point[1] - line.coords[-2][1]
    )

    # Calculate the new end point by extending the last point along the direction vector
    new_end_point = (end_point[0] + direction_vector_end[0] * additional_length,
                    end_point[1] + direction_vector_end[1] * additional_length)

    # if start :
    #     #We extend from the start also
    # # Create a new LineString with the extended length
    #     extended_line = LineString([new_start_point, *line.coords[1:], new_end_point])
    # else :
    extended_line = LineString([start_point, *line.coords[1:], new_end_point])
    
    
    return extended_line

def get_sea_lines(start, end, world = train_intensity, nb = 80):
    #We use train because it's already loaded
    # Create a mesh
    # Possibility to optimize the mesh ?
    quadri = []
    for lon in np.linspace(-135, 180, nb): #limiter au range longitude - latidue +/- 20
        quadri.append(LineString([(lon, -90), (lon, 90)]))
    for lat in np.linspace(-60, 75, nb):
        quadri.append(LineString([(-180, lat), (180, lat)]))
    #Add also the direct path 
    quadri.append(LineString([start, end]))
    #Cut  the geometries where there is sea
    sea =  gpd.overlay(gpd.GeoDataFrame(geometry = gpd.GeoSeries(
        quadri)), world[['geometry']] , how='difference', keep_geom_type=False)#.explore(), crs='epsg:4326')
    
    # Need to extend lines ? seems not
    #sea['geometry'] = sea['geometry'].apply(lambda x : extend_line(x, additional_length=0.001))
    return sea.explode()

def gdf_lines(start, end, add_canal = True):
    # Get coast lines
    coast_lines0, coast_exp0 = create_cost(buffer=0)
    canal = []
    if add_canal : 
        # Panama
        canal.append(LineString([
            (-79.51006995072298, 8.872893100443669),
            (-80.05324567583347, 9.517999845306024)                                 
                                 ]))
        # Suez
        canal.append(LineString([
            (33.91896382986125, 27.263740326941672),
            (32.505571710241114, 29.64748606563672),
            (32.42803964605657, 32.58754502651166)                                 
                                 ]))
        
    #Combine
    full_edge = unary_union(coast_exp0 + canal +
                            [extend_line(get_line_coast(p, coast_lines0)) for p in [start, end]] + 
                            #Extend the lines for the shortest path to the sea
                            [extend_line(k) for k in list(get_sea_lines(start, end).geometry.values)]) # get the lines where ferry can navigate
    return gpd.GeoDataFrame(geometry = gpd.GeoSeries(full_edge)).explode() #, crs='epsg:4326'


def get_shortest_path(line_gdf, start, end):
    # To graph
    graph = momepy.gdf_to_nx(line_gdf, approach = 'primal', multigraph = False)
    #print(graph.nodes)
    #Shortest path
    path = nx.shortest_path(graph, source = start, target = end, weight='mm_len')
    # Extract the edge geometries of the shortest path
    shortest_path_edges = [(path[i], path[i + 1]) for i in range(len(path) - 1)]
    shortest_path_geometries = [graph.get_edge_data(u, v)['geometry'] for u, v in shortest_path_edges if 'geometry' in graph.get_edge_data(u, v)]

    # Merge the geometries of the edges in the shortest path
    merged_geometry = unary_union(shortest_path_geometries)

    return merged_geometry