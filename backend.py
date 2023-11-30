#Classic
import geopandas as gpd
import pandas as pd
import numpy as np

#Geometry
from shapely.geometry import  LineString, MultiLineString
from shapely import ops
from pyproj import Geod

#Plotting
import plotly.express as px
import plotly.graph_objects as go
from plotly.io import to_json

#Web
import requests

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

# Request data to get the pathway from lat lon of departure and arrival
def query_ntag(tag1, tag2, id_based):
    #Format lon , lat
    if id_based :
        #We should use the ids of the train stations
        url = f"https://trainmap.ntag.fr/api/route?dep={id1}&arr={id2}&simplify=1"
    else :
        #We should use geogrphical coordinates
        url = f"https://trainmap.ntag.fr/api/route?dep={tag1[0]},{tag1[1]}&arr={tag2[0]},{tag2[1]}&simplify=1"
    # Send the GET request
    response = requests.get(url)

    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        # Parse the response content as needed
        data = response.text
        print("Path retrieved!")
    else:
        # Error message
        print(f"Failed to retrieve data. Status code: {response.status_code}")

    #Store data in a geodataserie
    gdf = gpd.GeoSeries(LineString(response.json()['geometry']['coordinates'][0]), crs='epsg:4326')

    return gdf

# def filter_countries(gdf):
#     #Load europe / or world
#     europe = gpd.read_file('static/europe.geojson')
#     #Make the split by geometry
#     gdf.name = 'geometry'
#     res = gpd.overlay(gpd.GeoDataFrame(gdf, geometry = 'geometry', crs='epsg:4326'), europe, how='intersection')
#     return res

def kilometer_to_degree(km):
    c = 180/(np.pi * 6371)
    return c*km

#New function to handle the bridges or tunnel over / under the sea
def filter_countries(gdf):
    #Load europe / or world
    europe = gpd.read_file('static/europe.geojson')
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
        test = diff_2[diff_2.length > kilometer_to_degree(5)].sjoin_nearest(europe, how='left')
        # Aggregation per country and combining geometries
        u = pd.concat([res.explode(), test.explode()]).groupby('ISO2').agg(NAME = ('NAME', lambda x : x.iloc[0]),
 geometry = ('geometry', lambda x : ops.linemerge(MultiLineString(x.values))))
    else:
        u = res.explode().groupby('ISO2').agg(NAME = ('NAME', lambda x : x.iloc[0]),
 geometry = ('geometry', lambda x : ops.linemerge(MultiLineString(x.values))))
    # Rendering result
    res = gpd.GeoDataFrame(u, geometry='geometry', crs='epsg:4326').reset_index()
    return res


#Create a Linestring that looks like a plane path
def create_plane(a, nb, tag1, tag2):
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

def compute_ef(gdf, geom_plane):
    #Load electric mixed
    mix = pd.read_csv('static/mix_2022_conso.csv', delimiter=';')
    # Join with data
    jf = pd.merge(gdf, mix, on='ISO2', how='inner')
    # Mix de référence SNCF : https://medias.sncf.com/sncfcom/pdf/DESTE/Methodologie-generale-InfoGES_2022.pdf
    mix_ref = 60.7
    # Facteur INtercité ref
    FE_ref = 6.73 # TGV : 2.71
    FE_diesel = 79.18 #Voir ADEME
    # Compute the emission factor of electric trains
    jf['FE_elec'] = round(FE_ref * jf['mix_conso_2022'] / mix_ref, 1)
    # Sort values
    jf = jf.sort_values('FE_elec')
    # Add colors
    jf['colors'] = ['#'+k for k in pd.Series(charte_mollow[::-1])[[int(k) for k in np.linspace(0, 9, jf.shape[0])]]]
    # Add plane emission factor and geometry
    gdf_plane = pd.DataFrame(pd.Series({ 'FE_elec':255, 'colors':'#00008B', 'NAME':'Plane', 'geometry':geom_plane})).transpose()
    jf = pd.concat([jf, gdf_plane], axis=0).reset_index(drop=True)
    return jf



def plotly_chart(gdf, tag1, tag2):
    #For trains
    l_length = []
    # Compute the true distance
    geod = Geod(ellps="WGS84")
    for geom in gdf.geometry.values :
        l_length.append(geod.geometry_length(geom) / 1e3)
    # Add the distance to the dataframe
    gdf['path_length'] = l_length
    print('Train : ', gdf.path_length.sum(), ' km')
    # Compute emissions : EF * length
    gdf['kgCO2eq'] = gdf['path_length'] * gdf['FE_elec'] / 1e3
    gdf['Mean of Transport'] = 'Train'
    #For planes
    # Distance (straight line)
    bird = geod.geometry_length(LineString([tag1, tag2]))/1e3
    print('plane : ', bird, ' km')
    # Direct CO2 emissions
    plane_co2 = pd.Series({'Mean of Transport':'Plane', 'kgCO2eq':bird*.085, 'colors':'#00008B', 'NAME':'CO2'})
    # Non-CO2 contributions to radiative forcings
    plane_other = pd.Series({'Mean of Transport':'Plane', 'kgCO2eq':bird*2*.085, 'colors':'#00004B', 'NAME':'non-CO2 radiative forcing effects (contrails, NOx)'})
    # Concatenate everything
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
#plot(fig, include_plotlyjs="cdn", output_type='div').replace('<div>', '<div id="pie">') # image_height=350, image_width = 200

