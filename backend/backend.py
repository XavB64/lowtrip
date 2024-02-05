
#####################
### Librairies ######
#####################


#Classic
import geopandas as gpd
import pandas as pd
import numpy as np
import matplotlib

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

######################
## Global variables ##
######################


#Load  world
world = gpd.read_file('static/world.geojson')

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

#Select main colors
cmap_custom = 'Blues' #default
cmap_direct = 'Oranges'

# Geometries from API
simplified = True
if simplified :
    train_s, route_s = '1', 'simplified'
else :
    train_s, route_s = '0', 'full'

# Validation perimeter 
val_perimeter = 500 #km

# Search areas
search_perimeter = [.2, 10] #km

#Threshold for unmatched train geometries (sea)
sea_threshold = 5 #km

#Emission factors g/pkm
EF_car = .2176
EF_bus = .02942
EF_plane = {'short': .126, 'medium': .0977, 'long': .08306}
EF_ferry = .3

# Number of points in plane geometry
nb_pts = 100

#Additional emissions from plane
cont_coeff = 2
hold = 3.81 #kg/p



###################
###### Utils ######
###################


def flatten_list_of_tuples(lst):
        #We reverse the geometry so the latitude are written before the longitude (Overpass API nomenclature)
        return [item for tup in lst for item in tup[::-1]]


#Not really accurate but good enough and fast for some purposes
def kilometer_to_degree(km):
    c = 180 / (np.pi * 6371) #Earth radius (km)
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
    #print(len(buff))
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
    url = f"https://trainmap.ntag.fr/api/route?dep={tag1[0]},{tag1[1]}&arr={tag2[0]},{tag2[1]}&simplify="+train_s #1 to simplify it
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
        gdf, train = pd.DataFrame(), False
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
    url = 'http://router.project-osrm.org/route/v1/driving/'+str(tag1[0])+','+str(tag1[1])+';'+str(tag2[0])+','+str(tag2[1])+'?overview='+route_s+'&geometries=geojson'
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
        gdf = pd.DataFrame()
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
            #else :
                #No need to retry the API
              #  print(tag1_new, tag2_new)

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


def train_to_gdf(tag1, tag2, perims=search_perimeter, validate=val_perimeter, colormap=charte_mollow): #charte_mollow
    '''
    parameters:
        - tag1, tag2
        - perims
        - validate
        - colormap, list of colors
    return:
        - full dataframe for trains
    '''
    #First try with coordinates supplied by the user
    gdf, train = find_train(tag1, tag2)

    #If failure then we try to find a better spot nearby - Put in another function
    if train == False :
        # We try to search nearby the coordinates and request again
        #print( extend_search(tag1, tag2, perims) )
        gdf, train = extend_search(tag1, tag2, perims)

    # Validation part for train
    if train : #We have a geometry
        if not validate_geom(tag1, tag2, gdf.values[0], validate):
            gdf, train = pd.DataFrame(), False

    if train : #We need to filter by country and add length / Emission factors
        gdf = filter_countries_world(gdf)
         # Sort values
        gdf = gdf.sort_values('EF_tot')
        # Add colors, here discretise the colormap
        gdf['colors'] = colormap
        #gdf['colors'] = ['#'+k for k in pd.Series(colormap[::-1])[[int(k) for k in np.linspace(0, len(colormap)-1, gdf.shape[0])]]]
        # Adding and computing emissions
        #For trains
        l_length = []
        # Compute the true distance
        geod = Geod(ellps="WGS84")
        for geom in gdf.geometry.values :
            l_length.append(geod.geometry_length(geom) / 1e3)
        # Add the distance to the dataframe
        gdf['path_length'] = l_length
        # print('Train : ', gdf.path_length.sum(), ' km')
        # Compute emissions : EF * length
        gdf['EF_tot'] = gdf['EF_tot'] / 1e3 #Conversion in in kg
        gdf['kgCO2eq'] = gdf['path_length'] * gdf['EF_tot']
        gdf['Mean of Transport'] = 'Train'
    #Returning the result
    return gdf, train


def car_bus_to_gdf(tag1, tag2, EF_car=EF_car, EF_bus=EF_bus, color = '#00FF00', validate = val_perimeter):
    '''
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
    '''
    ### Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)

       # Validation part for route
    if route : #We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    if route :
        gdf_car = pd.DataFrame(pd.Series({ 'kgCO2eq':route_dist*EF_car, 'EF_tot':EF_car,'path_length':route_dist, 'colors':color, 'NAME':'Car', 'Mean of Transport':'Car', 'geometry':geom_route})).transpose() #'EF_tot':EF_car / nb,
        gdf_bus = pd.DataFrame(pd.Series({ 'kgCO2eq':route_dist*EF_bus, 'EF_tot':EF_bus, 'path_length':route_dist, 'colors':color, 'NAME':'Bus',  'Mean of Transport':'Bus', })).transpose() #'EF_tot':EF_bus, enlever geometry
    else:
        gdf_car, gdf_bus = pd.DataFrame(), pd.DataFrame()
    return gdf_car, gdf_bus, route

def bus_to_gdf(tag1, tag2, EF_bus=EF_bus, color = '#00FF00', validate = val_perimeter, nb = 1):
    '''
    parameters:
        - tag1, tag2
        - EF_bus, float emission factor for bus by pkm
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip)
    return:
        - full dataframe for bus
    '''
    ### Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)

       # Validation part for route
    if route : #We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    if route :
        gdf_bus = pd.DataFrame(pd.Series({ 'kgCO2eq':route_dist*EF_bus, 'EF_tot':EF_bus, 'path_length':route_dist, 'colors':color, 'NAME':'Bus',  'Mean of Transport':'Bus', 'geometry':geom_route })).transpose() #'EF_tot':EF_bus, enlever geometry
    else:
        gdf_bus = pd.DataFrame()
    return gdf_bus, route

def car_to_gdf(tag1, tag2, EF_car=EF_car, color = '#00FF00', validate = val_perimeter, nb = 1):
    '''
    parameters:
        - tag1, tag2
        - EF_car, float emission factor for one car by km
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip)
    return:
        - full dataframe for car
    '''
    ### Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)

       # Validation part for route
    if route : #We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    if route :
        gdf_car = pd.DataFrame(pd.Series({ 'kgCO2eq':route_dist*EF_car / nb, 'EF_tot' : EF_car/nb, 'path_length':route_dist, 'colors':color, 'NAME':'Car', 'Mean of Transport':'Car', 'geometry':geom_route})).transpose() #'EF_tot':EF_car / nb,
    else:
        gdf_car = pd.DataFrame()

    return gdf_car, route

def plane_to_gdf(tag1, tag2, EF_plane=EF_plane, contrails=cont_coeff, holding=hold, color = '#00008B', color_contrails='#00004B'):
    '''
    parameters:
        - tag1, tag2
        - EF : emission factor in gCO2/pkm for plane depending on journey length
        - contrails : coefficient to apply to take into account non-CO2 effects
        - holding : additional CO2 emissions (kg) due to holding patterns
        - color : color for path and bar chart
        - color_contrails : color for non CO2-effects in bar chart
    return:
        - full dataframe for plane, geometry for CO2 only (optimization)
    '''
    #Compute geometry and distance (geodesic)
    geom_plane, bird = great_circle_geometry(tag1, tag2)
    #print(bird)

    # Detour coefficient :
    if bird < 1000 :
        bird = (4.1584 * bird**(-.212)) * bird
    # Different emission factors depending on the trip length
    if bird < 1000 :
        EF = EF_plane['short']
    elif bird < 3500 :
        EF = EF_plane['medium']
    else : #It's > 3500
        EF = EF_plane['long']
    # Compute geodataframe and dataframe
    gdf_plane = pd.DataFrame(pd.Series({ 'kgCO2eq':EF*bird + holding, 'EF_tot':EF, 'path_length':bird, 'colors':color, 'NAME':'CO2',  'Mean of Transport':'Plane', 'geometry':geom_plane})).transpose()
    #gdf_plane.geometry = gdf_plane.geometry.astype('geometry')
    gdf_non_co2 = pd.DataFrame(pd.Series({ 'kgCO2eq':EF*contrails*bird, 'colors':color_contrails, 'NAME':'Contrails',  'Mean of Transport':'Plane', })).transpose()
    return gdf_plane, gdf_non_co2

def ferry_to_gdf(tag1, tag2, EF=EF_ferry, color = '#FF0000'):
    '''
    parameters:
        - tag1, tag2
        - EF : emission factor in gCO2/pkm for ferry
        - color : color for path and bar chart
    return:
        - full dataframe for ferry
    '''
    #Compute geometry
    geom = LineString([tag1, tag2])
    # Compute the true distance
    geod = Geod(ellps="WGS84")
    bird = geod.geometry_length(geom)/1e3
    # Compute geodataframe and dataframe
    gdf_ferry = pd.DataFrame(pd.Series({ 'kgCO2eq':EF*bird, 'EF_tot':EF, 'path_length':bird, 'colors':color, 'NAME':'Ferry',  'Mean of Transport':'Ferry', 'geometry':geom})).transpose()
   # gdf_ferry.geometry = gdf_ferry.geometry.astype('geometry')

    return gdf_ferry


def filter_countries_world(gdf, th = sea_threshold):
    '''
    Filter train path by countries (world.geojson)
    parameters:
        - gdf : train geometry in geoserie
        - th : threshold to remove unmatched gaps between countries that are too small (km)
    return:
        - Geodataframe of train path by countries
    '''
    #Make the split by geometry
    gdf.name = 'geometry'
    res = gpd.overlay(gpd.GeoDataFrame(gdf, geometry = 'geometry', crs='epsg:4326'), world, how='intersection')
    diff = gpd.overlay(gpd.GeoDataFrame(gdf, geometry = 'geometry', crs='epsg:4326'), world, how='difference')
    # Check if the unmatched data is significant
    if diff.length.sum() > kilometer_to_degree(th) :
        print('Sea detected')
    # In case we have bridges / tunnels across sea:
    # Distinction depending on linestring / multilinestring
        if diff.geometry[0].geom_type == 'MultiLineString':
          #  print('MultiLinestring')
            diff_2 = gpd.GeoDataFrame(list(diff.geometry.values[0].geoms))
        else :
            print('Linestring')
            diff_2 = gpd.GeoDataFrame(list(diff.geometry.values))
        diff_2.columns = ['geometry']
        diff_2 = diff_2.set_geometry('geometry', crs='epsg:4326')
        # Filter depending is the gap is long enough to be taken into account and join with nearest country
        test = diff_2[diff_2.length > kilometer_to_degree(th)].sjoin_nearest(world, how='left')
        # Aggregation per country and combining geometries
        u = pd.concat([res.explode(), test.explode()]).groupby('ISO2').agg(NAME = ('NAME', lambda x : x.iloc[0]),EF_tot = ('EF_tot', lambda x : x.iloc[0]),
 geometry = ('geometry', lambda x : ops.linemerge(MultiLineString(x.values))))
    else:
        u = res.explode().groupby('ISO2').agg(NAME = ('NAME', lambda x : x.iloc[0]), EF_tot = ('EF_tot', lambda x : x.iloc[0]),
 geometry = ('geometry', lambda x : ops.linemerge(MultiLineString(x.values))))
    # Rendering result
    res = gpd.GeoDataFrame(u, geometry='geometry', crs='epsg:4326').reset_index()
    return res


def great_circle_geometry(dep, arr, nb = nb_pts):
    '''
    Create the great circle geometry with pyproj
    parameters:
        - nb : number of points
        - dep, arr : departure and arrival
    return:
        - shapely geometry (Linestring)
        - Geodesic distance in km
    '''
    # projection
    geod = Geod(ellps="WGS84")
    # returns a list of longitude/latitude pairs describing npts equally spaced
    # intermediate points along the geodesic between the initial and terminus points.
    r = geod.inv_intermediate(lon1= float(dep[0]), lat1= float(dep[1]), lon2= float(arr[0]), lat2= float(arr[1]), npts= nb, initial_idx = 0, terminus_idx = 0)

    # Create the geometry
    #Displaying results over the antimeridian
    if abs(min(r.lons) - max(r.lons)) > 180 :
        #Then the other way is faster, we add 360° to the destination with neg lons
        l = [[lon, lat] for lon, lat in zip([lon + 360 if lon < 0 else lon for lon in r.lons], r.lats)]
    else :
        l = [[lon, lat] for lon, lat in zip(r.lons, r.lats)]

    # Return geometry and distance
    return LineString(l), r.dist / 1e3 #in km


def plotly_v2(gdf):
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

    return graph_json, fig


def compute_emissions_custom(data, cmap = cmap_custom):
    '''
    parameters:
        - data, pandas dataframe format (will be json)
    return:
        - full dataframe for emissions
        - geodataframe for path
    '''
    #Colors
    #Custom trip
    list_items = ['Train', 'Bus', 'Car', 'Plane_contrails', 'Plane', 'Ferry']
    cmap = matplotlib.cm.get_cmap(cmap_custom)
    colors = [matplotlib.colors.to_hex(cmap(x)) for x in np.linspace(0.2, 1, len(list_items))]
    color_custom = dict(zip(list_items, colors))
    #Loop
    l= []
    geo = []
    for idx in data.index[:-1] : # We loop until last departure
        # Mean of transport
        mean = data.loc[idx].transp
        # Departure coordinates
        lon = data.loc[idx].lon
        lat = data.loc[idx].lat
        tag1 = (lon , lat)
        # Arrival coordinates
        lon = data.loc[str(int(idx)+1)].lon
        lat = data.loc[str(int(idx)+1)].lat
        tag2 = (lon , lat)

        # Compute depending on the mean of transport
        if mean == 'Train':
            gdf, train = train_to_gdf(tag1, tag2, colormap = color_custom['Train'])
            l.append(gdf)
            geo.append(gdf)

        elif mean == 'Bus' :
            gdf_bus, route = bus_to_gdf(tag1, tag2, color=color_custom['Bus'])
            l.append(gdf_bus)
            geo.append(gdf_bus)

        elif mean == 'Car':
            # We get the number of passenger
            nb = int(data.loc[idx].nb)
            gdf_car, route = car_to_gdf(tag1, tag2, nb=nb,  color=color_custom['Car'])
            l.append(gdf_car)
            geo.append(gdf_car)

        elif mean == 'Plane':
            gdf_plane, gdf_cont = plane_to_gdf(tag1, tag2,  color=color_custom['Plane'], color_contrails=color_custom['Plane_contrails'])
            l.append(gdf_plane)
            l.append(gdf_cont)
            geo.append(gdf_plane)

        elif mean == 'Ferry':
            gdf_ferry = ferry_to_gdf(tag1, tag2,  color=color_custom['Ferry'])
            l.append(gdf_ferry)
            geo.append(gdf_ferry)

     # Data for bar chart
    data = pd.concat(l)
    if data.shape[0] != 0: # We can go on
        data = data.reset_index(drop=True).drop('geometry', axis=1)
        # Geodataframe for map
        geodata = gpd.GeoDataFrame(pd.concat(geo), geometry='geometry', crs='epsg:4326')
    else : #My trip failed, we return nothing
        geodata = pd.DataFrame()

    return data, geodata



def compute_emissions_all(data, cmap = cmap_direct):
    '''
    If data is only one step then we do not compute this mean of transport as it will
    appear in "my_trip"
    parameters:
        - data, pandas dataframe format (will be json)
    return:
        - full dataframe for emissions
        - geodataframe for path
    '''
    #colors
    #Direct trip
    list_items = ['Train', 'Car&Bus',  'Plane_contrails', 'Plane']
    cmap = matplotlib.cm.get_cmap(cmap_direct)
    colors = [matplotlib.colors.to_hex(cmap(x)) for x in np.linspace(0.2, 1, len(list_items))]
    color_direct = dict(zip(list_items, colors))
    # Departure coordinates
    lon = data.loc['0'].lon
    lat = data.loc['0'].lat
    tag1 = (lon , lat)
    # Arrival coordinates
    lon = data.loc[str(data.shape[0] - 1)].lon
    lat = data.loc[str(data.shape[0] - 1)].lat
    tag2 = (lon , lat)

    # Check if we should compute it or not
    train, plane, car, bus = True, True, True, True
    if data.shape[0] == 2: #Then it's only one step, we will not add it to direct trip calulations
        #Retrieve the mean of transport: Car/Bus/Train/Plane
        transp = data.loc['0'].transp
        if transp == 'Train':
            train = False
        elif transp == 'Plane':
            plane = False
        elif transp == 'Car':
            car = False
        elif transp == 'Bus':
            bus = False
    #Loop
    l= []
    geo = []

    # Train
    if train :
        gdf, train = train_to_gdf(tag1, tag2, colormap=color_direct['Train'])
        l.append(gdf)
        geo.append(gdf)

    # Car & Bus
    gdf_car, gdf_bus, route = car_bus_to_gdf(tag1, tag2, color=color_direct['Car&Bus'])
    if bus :
        l.append(gdf_bus)
    if car :
        l.append(gdf_car)
    geo.append(gdf_car)

    # Plane
    if plane :
        gdf_plane, gdf_cont = plane_to_gdf(tag1, tag2, color=color_direct['Plane'], color_contrails=color_direct['Plane_contrails'])
        l.append(gdf_plane)
        l.append(gdf_cont)
        geo.append(gdf_plane)

    # We do not add the ferry in the general case

    if (route == False) & (train==False) & (plane==False):
        #Only happens when plane was asked and the API failed
        data, geodata = pd.DataFrame(), pd.DataFrame()
    else :
        # Data for bar chart
        data = pd.concat(l).reset_index(drop=True).drop('geometry', axis=1)
        # Geodataframe for map
        geodata = gpd.GeoDataFrame(pd.concat(geo), geometry='geometry', crs='epsg:4326')

    return data, geodata

def bchart_1(mytrip, direct):
    '''
    parameters:
        - mytrip, dataframe of custom trip
        - direct, dataframe of direct trip
    return:
        - json
        - plotly figure
    '''
    # Treatment for number of passengers in car for direct
    # all_car = pd.concat(5 * [direct[direct['NAME']=='Car']], ignore_index=True)
    # all_car['kgCO2eq'] /= 5

    # direct = pd.concat([direct[~direct['Mean of Transport'].isin(['Car'])], all_car])
    if mytrip.shape[0] != 0: # Faire de même pour bchart2
        # Merging means of transport for custom trip
        mytrip['NAME'] = mytrip['Mean of Transport'] + ' - ' + mytrip['NAME']
        # Separtating bars
        mytrip['Mean of Transport'] = 'My trip'
        direct['Type'] = 'Direct'
    # Combine
    l_tot = pd.concat([mytrip, direct]).reset_index(drop=True)
    return plotly_v2(l_tot)

def bchart_2(mytrip, alternative):
    '''
    parameters:
        - mytrip, dataframe of custom trip
        - alternative, dataframe of alternative trip
    return:
        - json
        - plotly figure
    '''
    # Merging means of transport for custom trips
    mytrip['NAME'] = mytrip['Mean of Transport'] + ' - ' + mytrip['NAME']
    alternative['NAME'] = alternative['Mean of Transport'] + ' - ' + alternative['NAME']
    # Separtating bars
    mytrip['Mean of Transport'] = 'My trip'
    alternative['Mean of Transport'] = 'Alternative'
    # Combine
    l_tot = pd.concat([mytrip, alternative]).reset_index(drop=True)
    return plotly_v2(l_tot)
