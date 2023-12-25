
#####################
### Librairies ######
#####################


#Classic
import geopandas as gpd
import pandas as pd
import numpy as np

#Geometry
from shapely.geometry import  LineString, MultiLineString, Point
from shapely import ops
from pyproj import Geod

#Plotting
import plotly.express as px
import plotly.graph_objects as go
from plotly.io import to_json

#Web
import requests


###################
###### Utils ######
###################

#Colors
charte_mollow = ['590D22',
            '800F2F',
            'A4133C',
            'C9184A',
            'FF4D6D',
            'FF758F',
            'FF8FA3',
            'FFB3C1',
            'FFCCD5',
            'FFD6DD']

# Hexadecimal code to RGB code
def hext_to_rgb(h, alpha):
    return list(int(h[i:i+2], 16)/255 for i in (0, 2, 4))
# List of rgb colors
rgb = []
for k in charte_mollow :
    rgb.append(hext_to_rgb(k, 0))


def flatten_list_of_tuples(lst):
        #We reverse the geometry so the latitude are written before the longitude (Overpass API nomenclature)
        return [item for tup in lst for item in tup[::-1]]


#Create a circle around (roughly), not really accurate but good enough and fast
def kilometer_to_degree(km):
    c = 180/(np.pi * 6371)
    return c*km


######################
#### Functions #######
######################



def find_nearest(lon, lat, perim):
    '''
    This function find the nearest node for train raiway in the OSM network using Overpass API
    parameters:
        - lon, lat : coordinates in degree of the point
        - perim : perimeters (m) to look around 
    return:
        - new coordinates(lat, lon)
    '''
   #Extend the area around the point
    buff = list(Point(lon, lat).buffer(kilometer_to_degree(perim)).exterior.coords)
    print(len(buff))
    #Request Overpass API turbo data :
    l = flatten_list_of_tuples(buff)

    #Overpass API nomenclature - filter by polygon
    st = ""
    for k in l :
        st+=str(k)+" "

    #Prepare the request
    url = "http://overpass-api.de/api/interpreter"  #To avoid the natural space at the end
    query = '[out:json][timeout:300];(way(poly : "'+st[:-1]+'")["railway"="rail"];);out geom;' #;convert item ::=::,::geom=geom(),_osm_type=type()

    #Make request 
    response = requests.get(url, params={'data': query})

    #if response.status_code == 200: not working, looking at size of elements also
    if (response.status_code == 200) & (len(response.json()['elements']) > 0) :
        # Extract the first point coordinates we could found
        new_point = pd.json_normalize(response.json()['elements'][0]).loc[0].geometry[0]#.columns
        #Return lon, lat
        return (new_point['lon'], new_point['lat'])
    else :
        #Couldn't find a node
        return False

def find_train(tag1, tag2) :
    '''
    Find train path between 2 points. Can use ntag API or signal. 
    parameters:
        - tag1, tag2 : list or tuple like (lon, lat)
    return:
        - gdf, a geoserie with the path geometry / None if failure
        - train, boolean
    '''
    # format lon, lat
    # Build the request url
    #trainmap
    url = f"https://trainmap.ntag.fr/api/route?dep={tag1[0]},{tag1[1]}&arr={tag2[0]},{tag2[1]}&simplify=0" #1 to simplify it
    #signal
    # url = f'https://signal.eu.org/osm/eu/route/v1/train/{tag1[0]},{tag1[1]};{tag2[0]},{tag2[1]}?overview=full' #or simplified
    # Send the GET request
    response = requests.get(url)

    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        print("Path retrieved!")
        response = requests.get(url)

        # Store data in a geodataserie - trainmap
        gdf = gpd.GeoSeries(LineString(response.json()['geometry']['coordinates'][0]), crs='epsg:4326')
        # geom = LineString(response.json()['geometry']['coordinates'][0])
        # geod = Geod(ellps="WGS84")
        # print('Train intial', geod.geometry_length(geom) / 1e3)

        # Store data - signal
        # geom = LineString(convert.decode_polyline(requests.get(url).json()['routes'][0]['geometry'])['coordinates'])
        # #geometry = resp.json()['waypoints'][0]['hint']
        # gdf = gpd.GeoSeries(geom, crs='epsg:4326')
        # geod = Geod(ellps="WGS84")
        # print('Train intial', geod.geometry_length(geom) / 1e3)
        train = True
    else :
        # Error message
        print(f"Failed to retrieve data. Status code: {response.status_code}")
        gdf, train = None, False
        #We will try to request again with overpass
    return gdf, train


def find_route(tag1, tag2):
    '''
    Find road path between 2 points
    parameters:
        - tag1, tag2 : list or tuple like ; (lon, lat)
    return:
        - geom_route : shapely geometry linestring
        - route_dist : float, distance in km 
        - route : boolean
    '''
    ### Route OSRM - create a separate function
    url = 'http://router.project-osrm.org/route/v1/driving/'+str(tag1[0])+','+str(tag1[1])+';'+str(tag2[0])+','+str(tag2[1])+'?overview=full&geometries=geojson'
    response = requests.get(url)
    if response.status_code == 200:
        geom = response.json()['routes'][0]['geometry']
        geom_route = LineString(geom['coordinates'])#convert.decode_polyline(geom)
        route_dist = response.json()['routes'][0]['distance'] / 1e3 # In km
        route = True
    else :
        geom_route, route_dist, route = None, None, False

    return geom_route, route_dist, route


def extend_search(tag1, tag2, perims):
    '''
    Function to use when the train path is not found directly by the API. 
    We search for nearby coordinates and request it again. 
    parameters:
        - tag1, tag2 : list or tuple like with coordinates (lon, lat)
        - perims : list-like ; perimeters to search for with overpass API
    return:
        - gdf (geoseries)
        - train (bool)
    '''
    #We extend the search progressively
    for perim in perims : 
        #Departure
        tag1_new = find_nearest(tag1[0], tag1[1], perim)
        if tag1_new != False :
            #Then we found a better place, we can stop the loop
            break
    #Maybe here try to check if the API is not already working
    if tag1_new == False :
        #Then we will find nothing
        gdf = None
        train = False
       # return None, False
    else :
        #We can retry the API
        gdf, train = find_train(tag1_new, tag2)
        if train == False :
            #We can change tag2
            for perim in perims : #Could be up to 10k  ~ size of Bdx
                #Arrival
                tag2_new = find_nearest(tag2[0], tag2[1], perim)
                if tag2_new != False :
                    break
            
            #Verify than we wan try to request the API again
            if (tag1_new != False) & (tag2_new != False) :
                gdf, train = find_train(tag1_new, tag2_new)
               # return gdf, train
            else :
                #No need to retry the API
                print(tag1_new, tag2_new)

    return gdf, train
    

def validate_geom(tag1, tag2, geom, th):
    '''
    Verify that the departure and arrival of geometries are close enough to the ones requested
    parameters:
        - tag1, tag2 : requested coordinates
        - geom : shapely geometry answered
        - th : threshold (km) for which we reject the geometry
    return:
        boolean (True valid geometry / False wrong geometry)
    '''
    geod = Geod(ellps="WGS84")
    #To compute distances
    # Creating geometries for departure
    ecart = LineString([tag1, list(geom.coords)[0]])
    #Maybe geod can compute length between 2 points directly
    if geod.geometry_length(ecart)/1e3 > th :
        print('Departure is not valid')
        return False
    # Arrival
    ecart = LineString([tag2, list(geom.coords)[-1]])
    #Maybe geod can compute length between 2 points directly
    if geod.geometry_length(ecart)/1e3 > th :
        print('Arrival is not valid')
        return False
    #If we arrive here both dep and arr where validated
    return True

# Request data to get the pathway from lat lon of departure and arrival
def query_path(tag1, tag2, perims=[.2, 10], validate=500): #Should change name
    '''
    This function return the path geometries for train and road (car, bus). 
    parameters:
        - tag1, tag2 : departure and arrival (lon, lat) list or tuple like
        - perims : list-like. Perimeters(km) to look around if the train API fails. 
    return:
        - gdf : geoseries from train path
        - geom_route : shapely geometry for road path
        - route_dist : road path length (km)
        - route, train : boolean. False if the API did not return anything. 
    '''
    #Format lon , lat
    #First try with coordinates supplied by the user 
    gdf, train = find_train(tag1, tag2)

    #If failure then we try to find a better spot nearby - Put in another function
    if train == False :
        # We try to search nearby the coordinates and request again
        print( extend_search(tag1, tag2, perims) )
        gdf, train = extend_search(tag1, tag2, perims) 

    # Validation part for train
    if train : #We have a geometry
        if not validate_geom(tag1, tag2, gdf.values[0], validate):
            gdf, train = None, False

    ### Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)
    
       # Validation part for route
    if route : #We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    return gdf, geom_route, route_dist, route, train



def filter_countries_world(gdf, th = 5):
    '''
    Filter train path by countries (world.geojson)
    parameters:
        - gdf : train geometry in geoserie
        - th : threshold to remove unmatched gaps between countries that are too small (km)
    return:
        - Geodataframe of train path by countries
    '''
    #Load europe / or world
    europe = gpd.read_file('static/world.geojson')
    #Make the split by geometry
    gdf.name = 'geometry'
    res = gpd.overlay(gpd.GeoDataFrame(gdf, geometry = 'geometry', crs='epsg:4326'), europe, how='intersection')
    diff = gpd.overlay(gpd.GeoDataFrame(gdf, geometry = 'geometry', crs='epsg:4326'), europe, how='difference')
    if diff.shape[0] > 0:
        print('Sea detected')
    # In case we have bridges / tunnels across sea: 
    # Distinction depending on linestring / multilinestring
        if diff.geometry[0].geom_type == 'MultiLineString':
            print('MultiLinestring')
            diff_2 = gpd.GeoDataFrame(list(diff.geometry.values[0].geoms))
        else :
            print('Linestring')
            diff_2 = gpd.GeoDataFrame(list(diff.geometry.values))
        diff_2.columns = ['geometry']
        diff_2 = diff_2.set_geometry('geometry', crs='epsg:4326')
        # Filter depending is the gap is long enough to be taken into account and join with nearest country
        test = diff_2[diff_2.length > kilometer_to_degree(th)].sjoin_nearest(europe, how='left')
        # Aggregation per country and combining geometries
        u = pd.concat([res.explode(), test.explode()]).groupby('ISO2').agg(NAME = ('NAME', lambda x : x.iloc[0]),EF_tot = ('EF_tot', lambda x : x.iloc[0]),
 geometry = ('geometry', lambda x : ops.linemerge(MultiLineString(x.values))))
    else:
        u = res.explode().groupby('ISO2').agg(NAME = ('NAME', lambda x : x.iloc[0]), EF_tot = ('EF_tot', lambda x : x.iloc[0]),
 geometry = ('geometry', lambda x : ops.linemerge(MultiLineString(x.values))))
    # Rendering result
    res = gpd.GeoDataFrame(u, geometry='geometry', crs='epsg:4326').reset_index()
    return res


#Create a Linestring that looks like a plane path
def create_plane( nb, tag1, tag2):
    '''
    Create a custom curved line for plane path
    parameters:
        - nb : number of points
        - tag1, tag2 : departure and arrival
    return:
        - shapely geometry (Linestring)
    '''
    #We fit a 2nd degree plynom to make a curve line
    x1, y1 = tag1[0], tag1[1]
    x2, y2 = tag2[0], tag2[1]
    distance = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    # The "a" parameter value depends on the distance between dep / arr
    a = 1 / distance
    # Compute the other parameters of the polynom
    c = (y2 - a*x2**2 - (x2/x1)*(y1 - a*x1**2))/(1 - x2/x1)
    b = (y1 - a*x1**2 - c)/x1
    l_y = []
    # Compute latitudes based on longitudes list
    l_x = np.linspace(min(x1, x2), max(x1, x2), nb)
    for k in l_x:
        l_y.append(a*k**2+b*k+c)
    # Create the linestring
    h = LineString([[l_x[i], l_y[i]] for i in range(nb)])

    return h


def compute_ef_world(gdf, geom_plane, geom_route, train, route):
    '''
    Create geodataframe for plotting on the map (with plane, car, and train)
    parameters:
        - gdf : geodataframe of train paths by countries
        - geom_plane : shapely geometry of plane path
        - geom_route : shapely geometry of route path
        - train, route : booleans. Plane is always displayed. 
    returns:
        Geodataframe with colors & geometries to plot, and emission factors for results
    '''
     # Add plane emission factor and geometry
    gdf_plane = pd.DataFrame(pd.Series({ 'EF_tot':255, 'colors':'#00008B', 'NAME':'Plane', 'geometry':geom_plane})).transpose()
    gdf_plane.geometry = gdf_plane.geometry.astype('geometry')
    if train :
        # Sort values
        jf = gdf.sort_values('EF_tot')
        # Add colors
        jf['colors'] = ['#'+k for k in pd.Series(charte_mollow[::-1])[[int(k) for k in np.linspace(0, 9, jf.shape[0])]]]
    else :
        jf = gdf
    if route:
        gdf_car = pd.DataFrame(pd.Series({ 'EF_tot':150, 'colors':'#00FF00', 'NAME':'Car', 'geometry':geom_route})).transpose()
    else :
        gdf_car = None

    jf = pd.concat([jf, gdf_plane, gdf_car], axis=0).reset_index(drop=True)[::-1]
    # if train & route == True:
    #     jf = pd.concat([jf, gdf_plane, gdf_car], axis=0).reset_index(drop=True)[::-1]
    # elif train == True:
    #     jf = pd.concat([jf, gdf_plane], axis=0).reset_index(drop=True)[::-1]
    # elif route == True :
    #     jf = pd.concat([gdf_plane, gdf_car], axis=0).reset_index(drop=True)[::-1]
    #     jf.to_csv('just_to_see.csv', index=False)
    # else :
    #     jf = gdf_plane
    return jf


def plotly_chart(gdf, tag1, tag2, dist_route, train, route):
    '''
    Create a plotly bar chart to visualise results in terms of emissions
    parameters:
        - gdf : geodataframe with geometries, mean of transport and emission factors
        - tag1, tag2 : departure and arrival coordinates 
        - dist_route : total distance of road
        - train, route : booleans
    return:
        - JSON Plotly bar chart
    '''
    # Compute the true distance
    geod = Geod(ellps="WGS84")
    if train :
        #For trains
        l_length = []
        
        for geom in gdf.geometry.values :
            l_length.append(geod.geometry_length(geom) / 1e3)
        # Add the distance to the dataframe
        gdf['path_length'] = l_length
        print('Train : ', gdf.path_length.sum(), ' km')
        # Compute emissions : EF * length
        gdf['kgCO2eq'] = gdf['path_length'] * gdf['EF_tot'] / 1e3
        gdf['Mean of Transport'] = 'Train'
    #For planes
    # Distance (straight line)
    bird = geod.geometry_length(LineString([tag1, tag2]))/1e3
    print('plane : ', bird, ' km')
    # Direct CO2 emissions
    plane_co2 = pd.Series({'Mean of Transport':'Plane', 'kgCO2eq':bird*.085, 'colors':'#00008B', 'NAME':'CO2'})
    # Non-CO2 contributions to radiative forcings
    plane_other = pd.Series({'Mean of Transport':'Plane', 'kgCO2eq':bird*2*.085, 'colors':'#00004B', 'NAME':'non-CO2 radiative forcing effects (contrails, NOx)'})
    # Cars
    if route :
        bus = pd.Series({'Mean of Transport':'Bus', 'kgCO2eq':dist_route*.03, 'colors':'#00FF00', 'NAME':'Thermal autocar'})
        car = pd.Series({'Mean of Transport':'Car', 'kgCO2eq':dist_route*.15, 'colors':'#00FF00', 'NAME':'Thermal car'})
        # Concatenate everything
        gdf = pd.concat([pd.DataFrame(plane_co2).transpose(), pd.DataFrame(plane_other).transpose(), pd.DataFrame(car).transpose(), pd.DataFrame(bus).transpose(), gdf], axis=0).reset_index(drop=True)
    else :
        gdf = pd.concat([pd.DataFrame(plane_co2).transpose(), pd.DataFrame(plane_other).transpose(), gdf], axis=0).reset_index(drop=True)
    # Plotting
    # For totals
    d = dict([(gdf.NAME[idx], gdf.colors[idx]) for idx in gdf.index])
    dfs = gdf[['Mean of Transport', 'kgCO2eq']].groupby('Mean of Transport').sum()
    # Plot bars
    fig = px.bar(gdf, x='Mean of Transport', y="kgCO2eq", color='NAME', color_discrete_map=d, width=200, height=350)
    fig.update_layout(showlegend=False)
    fig.update_layout(
    margin=dict(l=20, r=20, t=10, b=20),
    font = dict(size=10),
    hoverlabel=dict(
        bgcolor="white",
        font_size=8,
        )#font_family="Rockwell"
)
    # Plot Total
    fig.add_trace(go.Scatter(
    x=dfs.index,
    y=dfs['kgCO2eq'],
    text=dfs['kgCO2eq'].apply(lambda x : round(x, 1)),
    mode='text',
    textposition='top center',
    textfont=dict(
        size=10,
    ),
    showlegend=False
))
    fig.update_yaxes(range=[0,dfs.max().values[0]*1.2])
    # Save the figure
    #fig.write_html("static/test_chart.html")
    # Convert the figure to a JSON-compatible dictionary
    graph_json = to_json(fig)

    return graph_json
