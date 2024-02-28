#####################
### Librairies ######
#####################


# Classic
import geopandas as gpd
import pandas as pd
import numpy as np
import matplotlib

# Geometry
from shapely.geometry import LineString, MultiLineString, Point
from shapely import ops
from pyproj import Geod

# Web
import requests

######################
## Global variables ##
######################


# Load  world
world = gpd.read_file("static/world.geojson")

# Fields to return for bar chart
l_var = ["NAME", "Mean of Transport", "kgCO2eq", "colors"]

# Colors
charte_mollow = [
    "590D22",
    "800F2F",
    "A4133C",
    "C9184A",
    "FF4D6D",
    "FF758F",
    "FF8FA3",
    "FFB3C1",
    "FFCCD5",
    "FFD6DD",
]

# Select main colors
colors_custom = [
    "#b3eef5",
    "#7de4f0",
    "#4accdb",
    "#27A4B2",
    "#148693",
    "#006773"
]
colors_direct = [
    "#febc78",
    "#E69138",
    "#cd781f",
    "#B45E06",
]
colors_alternative = [
    "#ffd1d9",
    "#f9b5c1",
    "#f299a9",
    "#ec7d92",
    "#e5617a",
    "#df4562"
]

# Geometries from API
simplified = True
if simplified:
    train_s, train_t, route_s = "simplified", "1", "simplified" 
else:
    train_s, train_t, route_s = "full", "0", "full" 

# Validation perimeter
val_perimeter = 100  # km

# Search areas
search_perimeter = [0.2, 5]  # km

# Threshold for unmatched train geometries (sea)
sea_threshold = 5  # km

# Emission factors kg/pkm
EF_car = {'construction' : .0256, 
          'fuel' : .192} # total : .2176
EF_ecar = {
    'construction' : 0.0836,
    'fuel' : 0.17 #kWh / km
}

EF_bus = .02942
EF_ferry = .3
EF_plane = {"short": {
    'construction' : .00038,
    'upstream' : .0242,
    'combustion' : .117
},
            "medium": {
    'construction' : .00036,
    'upstream' : .0176,
    'combustion' : .0848
},
            "long": {
    'construction' : .00026,
    'upstream' : .0143,
    'combustion' : .0687
}
            }

# Number of points in plane geometry
nb_pts = 100
# Min distance for plane comparison
min_plane_dist = 500 #km

# Additional emissions from plane
cont_coeff = 2
hold = 3.81  # kg/p


###################
###### Utils ######
###################


def flatten_list_of_tuples(lst):
    # We reverse the geometry so the latitude are written before the longitude (Overpass API nomenclature)
    return [item for tup in lst for item in tup[::-1]]


# Not really accurate but good enough and fast for some purposes
def kilometer_to_degree(km):
    c = 180 / (np.pi * 6371)  # Earth radius (km)
    return c * km


######################
#### Functions #######
######################


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
        # Store data - signal
            gdf = gpd.GeoSeries(
                LineString(response.json()["routes"][0]["geometry"]["coordinates"]), crs="epsg:4326"
            )  
        train = True
    else:
        # Error message
        print(f"Failed to retrieve data. Status code: {response.status_code}")
        gdf, train = pd.DataFrame(), False
        # We will try to request again with overpass
    return gdf, train


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
    # return None, False
    else:
        # We can retry the API
        gdf, train = find_train(tag1_new, tag2)
        if train == False:
            # We can change tag2
            for perim in perims:  # Could be up to 10k  ~ size of Bdx
                # Arrival
                tag2_new = find_nearest(tag2[0], tag2[1], perim)
                if tag2_new != False:
                    break

            # Verify than we wan try to request the API again
            if (tag1_new != False) & (tag2_new != False):
                gdf, train = find_train(tag1_new, tag2_new)

    return gdf, train


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


def train_to_gdf(
    tag1, tag2, perims=search_perimeter, validate=val_perimeter, colormap=charte_mollow
):  # charte_mollow
    """
    parameters:
        - tag1, tag2
        - perims
        - validate
        - colormap, list of colors
    return:
        - full dataframe for trains
    """
    # First try with coordinates supplied by the user
    gdf, train = find_train(tag1, tag2)

    # If failure then we try to find a better spot nearby - Put in another function
    if train == False:
        # We try to search nearby the coordinates and request again
        gdf, train = extend_search(tag1, tag2, perims)

    # Validation part for train
    if train:  # We have a geometry
        if not validate_geom(tag1, tag2, gdf.values[0], validate):
            gdf, train = pd.DataFrame(), False

    if train:  # We need to filter by country and add length / Emission factors
        gdf = filter_countries_world(gdf)
        # Add colors, here discretise the colormap
        gdf["colors"] = colormap
        # gdf['colors'] = ['#'+k for k in pd.Series(colormap[::-1])[[int(k) for k in np.linspace(0, len(colormap)-1, gdf.shape[0])]]]
        # Adding and computing emissions
        # For trains
        l_length = []
        # Compute the true distance
        geod = Geod(ellps="WGS84")
        for geom in gdf.geometry.values:
            l_length.append(geod.geometry_length(geom) / 1e3)
        # Add the distance to the dataframe
        gdf["path_length"] = l_length
        # Compute emissions : EF * length
        gdf["EF_tot"] = gdf["EF_tot"] / 1e3  # Conversion in in kg
        gdf["kgCO2eq"] = gdf["path_length"] * gdf["EF_tot"]
        gdf["Mean of Transport"] = "Train"
    # Returning the result
    return gdf, train


def car_bus_to_gdf(
    tag1, tag2, EF_car=EF_car, EF_bus=EF_bus, color="#00FF00", validate=val_perimeter
):
    """
    ONLY FOR FIRST FORM (optimization)
    parameters:
        - tag1, tag2
        - EF_car, float emission factor for one car by km
        - EF_bus, float emission factor for bus by pkm
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip)
    return:
        - full dataframe for car and bus, geometry only on car
    """
    ### Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    if route:
        gdf_car = pd.DataFrame(
            pd.Series(
                {
                    "kgCO2eq": route_dist * np.sum(list(EF_car.values())),
                    "EF_tot": np.sum(list(EF_car.values())),
                    "path_length": route_dist,
                    "colors": color,
                    "NAME": "1 pass.", #Préciser 1 passager ici pour le moment ?
                    "Mean of Transport": "Car",
                    "geometry": geom_route,
                }
            )
        ).transpose()  #'EF_tot':EF_car / nb,
        gdf_bus = pd.DataFrame(
            pd.Series(
                {
                    "kgCO2eq": route_dist * EF_bus,
                    "EF_tot": EF_bus,
                    "path_length": route_dist,
                    "colors": color,
                    "NAME": "Bus",
                    "Mean of Transport": "Bus",
                }
            )
        ).transpose()  #'EF_tot':EF_bus, enlever geometry
    else:
        gdf_car, gdf_bus = pd.DataFrame(), pd.DataFrame()
    return gdf_car, gdf_bus, route


def bus_to_gdf(
    tag1, tag2, EF_bus=EF_bus, color="#00FF00", validate=val_perimeter, nb=1
):
    """
    parameters:
        - tag1, tag2
        - EF_bus, float emission factor for bus by pkm
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip)
    return:
        - full dataframe for bus
    """
    ### Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    if route:
        gdf_bus = pd.DataFrame(
            pd.Series(
                {
                    "kgCO2eq": route_dist * EF_bus,
                    "EF_tot": EF_bus,
                    "path_length": route_dist,
                    "colors": color,
                    "NAME": " ",
                    "Mean of Transport": "Bus",
                    "geometry": geom_route,
                }
            )
        ).transpose()  #'EF_tot':EF_bus, enlever geometry
    else:
        gdf_bus = pd.DataFrame()
    return gdf_bus, route


def car_to_gdf(
    tag1, tag2, EF_car=EF_car, color="#00FF00", validate=val_perimeter, nb=1, electric = False
):
    """
    parameters:
        - tag1, tag2
        - EF_car, float emission factor for one car by km
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip)
    return:
        - full dataframe for car
    """
    if electric == False :
        ### Route OSRM - create a separate function
        geom_route, route_dist, route = find_route(tag1, tag2)
        if nb != "👍" :
            nb = int(nb)
            EF = (np.sum(list(EF_car.values())) / nb) + EF_car['fuel'] * .04 * (nb - 1) #Over consumption due to weight and luggages
            name = str(nb)+' pass.'
        else : #Hitch-hiking
            EF = EF_car['fuel'] * .04
            name = 'Hitch-hiking'

        # Validation part for route
        if route:  # We have a geometry
            if not validate_geom(tag1, tag2, geom_route, validate):
                geom_route, route_dist, route = None, None, False

        if route:
            gdf_car = pd.DataFrame(
                pd.Series(
                    {
                        "kgCO2eq": route_dist * EF,
                        "EF_tot": EF, #Adding consumption with more weight
                        "path_length": route_dist,
                        "colors": color,
                        "NAME": name,
                        "Mean of Transport": "Car",
                        "geometry": geom_route,
                    }
                )
            ).transpose()  #'EF_tot':EF_car / nb,
        else:
            gdf_car = pd.DataFrame()

    else : #Electric car
        ### Route OSRM - create a separate function
        geom_route, route_dist, route = find_route(tag1, tag2)
        EF = .05

        # Validation part for route
        if route:  # We have a geometry
            if not validate_geom(tag1, tag2, geom_route, validate):
                geom_route, route_dist, route = None, None, False

        if route:
            gdf_car = pd.DataFrame(
                pd.Series(
                    {
                        "kgCO2eq": route_dist * EF,
                        "EF_tot": EF, #Adding consumption with more weight
                        "path_length": route_dist,
                        "colors": color,
                        "NAME": 'Electric',
                        "Mean of Transport": "eCar",
                        "geometry": geom_route,
                    }
                )
            ).transpose()  #'EF_tot':EF_car / nb,
        else:
            gdf_car = pd.DataFrame()

    # Return the result
    return gdf_car, route



def plane_to_gdf(
    tag1,
    tag2,
    EF_plane=EF_plane,
    contrails=cont_coeff,
    holding=hold,
    color="#00008B",
    color_contrails="#00004B",
):
    """
    parameters:
        - tag1, tag2
        - EF : emission factor in gCO2/pkm for plane depending on journey length
        - contrails : coefficient to apply to take into account non-CO2 effects
        - holding : additional CO2 emissions (kg) due to holding patterns
        - color : color for path and bar chart
        - color_contrails : color for non CO2-effects in bar chart
    return:
        - full dataframe for plane, geometry for CO2 only (optimization)
    """
    # Compute geometry and distance (geodesic)
    geom_plane, bird = great_circle_geometry(tag1, tag2)

    # Different emission factors depending on the trip length
    if bird < 1000:
        # Detour coefficient :
        bird = (4.1584 * bird ** (-0.212)) * bird
        trip_category = 'short'
    elif bird < 3500:
        trip_category = 'medium'
    else:  # It's > 3500
        trip_category = 'long'
    # We sum the different contribution for CO2 only
    EF = np.sum(list(EF_plane[trip_category].values()))
    # Compute geodataframe and dataframe
    gdf_plane = pd.DataFrame(
        pd.Series(
            {
                "kgCO2eq": EF * bird + holding,
                "EF_tot": EF,
                "path_length": bird,
                "colors": color,
                "NAME": "CO2",
                "Mean of Transport": "Plane",
                "geometry": geom_plane,
            }
        )
    ).transpose()
    # Non CO2 contribution are determined from the combustion of fuel only
    gdf_non_co2 = pd.DataFrame(
        pd.Series(
            {
                "kgCO2eq": EF_plane[trip_category]['combustion'] * contrails * bird,
                "colors": color_contrails,
                "NAME": "Contrails & NOx",
                "Mean of Transport": "Plane",
            }
        )
    ).transpose()
    return gdf_plane, gdf_non_co2


def ferry_to_gdf(tag1, tag2, EF=EF_ferry, color="#FF0000"):
    """
    parameters:
        - tag1, tag2
        - EF : emission factor in gCO2/pkm for ferry
        - color : color for path and bar chart
    return:
        - full dataframe for ferry
    """
    # Compute geometry
    geom = LineString([tag1, tag2])
    # Compute the true distance
    geod = Geod(ellps="WGS84")
    bird = geod.geometry_length(geom) / 1e3
    # Compute geodataframe and dataframe
    gdf_ferry = pd.DataFrame(
        pd.Series(
            {
                "kgCO2eq": EF * bird,
                "EF_tot": EF,
                "path_length": bird,
                "colors": color,
                "NAME": " ",
                "Mean of Transport": "Ferry",
                "geometry": geom,
            }
        )
    ).transpose()
    # gdf_ferry.geometry = gdf_ferry.geometry.astype('geometry')

    return gdf_ferry


def filter_countries_world(gdf, th=sea_threshold):
    """
    Filter train path by countries (world.geojson)
    parameters:
        - gdf : train geometry in geoserie
        - th : threshold to remove unmatched gaps between countries that are too small (km)
    return:
        - Geodataframe of train path by countries
    """
    # Make the split by geometry
    gdf.name = "geometry"
    res = gpd.overlay(
        gpd.GeoDataFrame(gdf, geometry="geometry", crs="epsg:4326"),
        world,
        how="intersection",
    )
    diff = gpd.overlay(
        gpd.GeoDataFrame(gdf, geometry="geometry", crs="epsg:4326"),
        world,
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
            world, how="left"
        )
        # Aggregation per country and combining geometries
        u = (
            pd.concat([res.explode(), test.explode()])
            .groupby("ISO2")
            .agg(
                NAME=("NAME", lambda x: x.iloc[0]),
                EF_tot=("EF_tot", lambda x: x.iloc[0]),
                geometry=(
                    "geometry",
                    lambda x: ops.linemerge(MultiLineString(x.values)),
                ),
            )
        )
    else:
        u = (
            res.explode()
            .groupby("ISO2")
            .agg(
                NAME=("NAME", lambda x: x.iloc[0]),
                EF_tot=("EF_tot", lambda x: x.iloc[0]),
                geometry=(
                    "geometry",
                    lambda x: ops.linemerge(MultiLineString(x.values)),
                ),
            )
        )
    # Rendering result
    res = gpd.GeoDataFrame(u, geometry="geometry", crs="epsg:4326").reset_index()
    return res


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



def compute_emissions_custom(data, cmap=colors_custom):
    """
    parameters:
        - data, pandas dataframe format (will be json)
    return:
        - full dataframe for emissions
        - geodataframe for path
        - ERROR : string first step that fails
    """
    ERROR = ''
    #Ajouter une variable mean/other pour faire un message d'erreur personnalisé ?
    # Colors
    # Custom trip
    list_items = ["Train", "Bus", "Car", "Plane_contrails", "Plane", "Ferry"]
    color_custom = dict(zip(list_items, cmap))
    
    l = []
    geo = []
    fail = False # To check if the query is successfull
    for idx in data.index[:-1]:  # We loop until last departure
        # Departure coordinates
        depature = data.loc[idx]
        departure_coordinates = (depature.lon, depature.lat)

        # Arrival coordinates
        arrival = data.loc[str(int(idx) + 1)]
        arrival_coordinates = (arrival.lon, arrival.lat)

        # Mean of transport
        transport_mean = arrival.transp

        # Compute depending on the mean of transport
        if transport_mean == "Train":
            gdf, _train = train_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                colormap=color_custom["Train"],
            )
            if not _train : #One step is not succesful
                fail = True
                ERROR = 'step n°'+str(int(idx) + 1)+' failed with Train, please change mean of transport or locations. '
                break
            # Adding a step variable here to know which trip is it
            gdf["step"] = str(int(idx) + 1)
            l.append(gdf)
            geo.append(gdf)

        elif transport_mean == "Bus":
            gdf_bus, _bus = bus_to_gdf(
                departure_coordinates, arrival_coordinates, color=color_custom["Bus"]
            )
            if not _bus : #One step is not succesful
                fail = True
                ERROR = 'step n°'+str(int(idx) + 1)+' failed with Bus, please change mean of transport or locations. '
                break
            gdf_bus["step"] = str(int(idx) + 1)
            l.append(gdf_bus)
            geo.append(gdf_bus)

        elif transport_mean == "Car":
            # We get the number of passenger
            gdf_car, _car = car_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                nb=arrival.nb,
                color=color_custom["Car"],
            )
            if not _car : #One step is not succesful
                fail = True
                ERROR = 'step n°'+str(int(idx) + 1)+' failed with Car, please change mean of transport or locations. '
                break
            gdf_car["step"] = str(int(idx) + 1)
            l.append(gdf_car)
            geo.append(gdf_car)
        elif transport_mean == "eCar":
            # We get the number of passenger
            gdf_car, _car = car_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                nb=arrival.nb,
                color=color_custom["Car"],
                electric = True
            )
            if not _car : #One step is not succesful
                fail = True
                ERROR = 'step n°'+str(int(idx) + 1)+' failed with eCar, please change mean of transport or locations. '
                break
            gdf_car["step"] = str(int(idx) + 1)
            l.append(gdf_car)
            geo.append(gdf_car)

        elif transport_mean == "Plane":
            gdf_plane, gdf_cont = plane_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color=color_custom["Plane"],
                color_contrails=color_custom["Plane_contrails"],
            )
            gdf_plane["step"] = str(int(idx) + 1)
            gdf_cont["step"] = str(int(idx) + 1)
            l.append(gdf_plane)
            l.append(gdf_cont)
            geo.append(gdf_plane)

        elif transport_mean == "Ferry":
            gdf_ferry = ferry_to_gdf(
                departure_coordinates, arrival_coordinates, color=color_custom["Ferry"]
            )
            gdf_ferry["step"] = str(int(idx) + 1)
            l.append(gdf_ferry)
            geo.append(gdf_ferry)
            
    if fail :
        #One or more step weren't succesful, we return nothing
        data_custom = pd.DataFrame()
        geodata = pd.DataFrame()
    else :
        # Query successfull, we concatenate the data
        data_custom = pd.concat(l)
        data_custom = data_custom.reset_index(drop=True).drop("geometry", axis=1)
        # Geodataframe for map
        geodata = gpd.GeoDataFrame(pd.concat(geo), geometry="geometry", crs="epsg:4326")

    return data_custom, geodata, ERROR


def compute_emissions_all(data, cmap=colors_direct):
    """
    If data is only one step then we do not compute this mean of transport as it will
    appear in "my_trip"
    parameters:
        - data, pandas dataframe format (will be json)
    return:
        - full dataframe for emissions
        - geodataframe for path
    """
    # colors
    # Direct trip
    list_items = ["Train", "Car&Bus", "Plane_contrails", "Plane"]
    color_direct = dict(zip(list_items, cmap))
    # Departure coordinates
    lon = data.loc["0"].lon
    lat = data.loc["0"].lat
    tag1 = (lon, lat)
    # Arrival coordinates
    lon = data.loc[str(data.shape[0] - 1)].lon
    lat = data.loc[str(data.shape[0] - 1)].lat
    tag2 = (lon, lat)

    # Check if we should compute it or not
    train, plane, car, bus = True, True, True, True
    if (
        data.shape[0] == 2
    ):  # Then it's only one step, we will not add it to direct trip calulations
        # Retrieve the mean of transport: Car/Bus/Train/Plane
        transp = data.loc["1"].transp
        if transp == "Train":
            train = False
        elif transp == "Plane":
            plane = False
        elif transp == "Car":
            car = False
        elif transp == "Bus":
            bus = False
    #Check distance for plane
    geod = Geod(ellps = 'WGS84')
    if geod.geometry_length(LineString([tag1, tag2])) / 1e3 < min_plane_dist :
        #Then we do not suggest the plane solution
        plane = False
    # Loop
    l = []
    geo = []

    # Train
    if train:
        gdf, train = train_to_gdf(tag1, tag2, colormap=color_direct["Train"])
        l.append(gdf)
        geo.append(gdf)

    # Car & Bus
    gdf_car, gdf_bus, route = car_bus_to_gdf(tag1, tag2, color=color_direct["Car&Bus"])
    # To avoid errors in the bar chart, I don't know why the change of name propagates
    geo_car = gdf_car.copy()
    if bus:
        l.append(gdf_bus)
        #We change it
        #gdf_car['Mean of Transport'] = 'Bus'
    if car:
        l.append(gdf_car)
    #If we have a result for car and bus :
    if route:
        #We check if car or bus was asked for a 1 step
        if  (car==False) | (bus==False):
            #Then the step of custom trip will already display a geometry, display another next to it
            th = .04
            print('transform')
            geo_car['geometry'] = ops.transform(lambda x, y: (x+th, y+th), geo_car['geometry'].values[0])
            # We have to change the name of mean of transport Car or Bus if it's Bus
            if car == False :
                geo_car['Mean of Transport'] = 'Bus'
        else :
        #     #We have both
            geo_car['Mean of Transport'] = 'Car & Bus'
        print(geo_car)
        geo.append(geo_car)

    # Plane
    if plane:
        gdf_plane, gdf_cont = plane_to_gdf(
            tag1,
            tag2,
            color=color_direct["Plane"],
            color_contrails=color_direct["Plane_contrails"],
        )
        l.append(gdf_plane)
        l.append(gdf_cont)
        geo.append(gdf_plane)

    # We do not add the ferry in the general case

    if (route == False) & (train == False) & (plane == False):
        # Only happens when plane was asked and the API failed
        data, geodata = pd.DataFrame(), pd.DataFrame()
    else:
        # Data for bar chart
        data = pd.concat(l).reset_index(drop=True)[['kgCO2eq',  'colors', 'NAME',
       'Mean of Transport']]
        # Geodataframe for map
        geodata = gpd.GeoDataFrame(pd.concat(geo), geometry="geometry", crs="epsg:4326")

    return data, geodata


def chart_refactor(mytrip, alternative=None, do_alt=False):
    """
    This function prepare the data to be displayed in the chart correctly
    parameters:
        - mytrip, dataframe of custom trip
        - alternative, dataframe of alternative trip if requested
        - do_alt (bool), is there an alternative trip ?
    return:
        - data with changed fields for bar chart
    """
    #Check if my trip worked
    if mytrip.shape[0] > 0:
        # Merging means of transport for custom trips
        mytrip["NAME"] = (
            mytrip["step"] 
            + ". " 
            + mytrip["Mean of Transport"] 
            + " - " 
            + mytrip["NAME"]
        )  # + ' - ' + mytrip.index.map(str) + '\''
        # Separtating bars
        mytrip["Mean of Transport"] = "My trip"
        mytrip = mytrip[l_var]

    if do_alt:
        #Check if it worked
        if alternative.shape[0] > 0 :
            # We have to render alternative as well
            alternative["NAME"] = (
                alternative["step"]
                + ". "
                + alternative["Mean of Transport"]
                + " - "
                + alternative["NAME"]
                + " "
            )  # + ' - ' + alternative.index.map(str)
            alternative["Mean of Transport"] = "Other trip"
            # Then we return both
            
            return mytrip, alternative[l_var]
        #If it didnt work we return it (empty)
        
        else :
            return mytrip, alternative
        
    #If it didnt work we return it (empty)
    else:
        return mytrip
