import warnings
warnings.filterwarnings('ignore')

#Librairies
from flask import Flask, request, render_template, send_from_directory, json
from backend import *
from flask_cors import CORS, cross_origin #comment this on deployment

print(pd.__version__)

# Application
app = Flask(__name__, static_url_path='', static_folder='frontend/build')
CORS(app) #comment this on deployment
# app.config["DEBUG"] = True
app.config["APPLICATION_ROOT"] = "/"

@app.route('/', methods=["GET", "POST"])
def main():
    if request.method == "POST":
        # # Converting lat lon coordinates in ggod format
        # dep, arr = [float(k) for k in request.form["departure_coord"].split(',')[::-1]], [float(k) for k in request.form["arrival_coord"].split(',')[::-1]]
        # print(dep, arr)
        # # Request the pathway between dep and arr with coordinates
        # gdf, geom_route, dist_route, route, train = query_path(dep, arr)
        # print('Train ', train)
        # print('Route', route)
        # if train :
        #     # Apply a mask to get the relevant country
        #     gdf = filter_countries_world(gdf)
        #     print(gdf.NAME)
        # # Create plane path geometry (straight line tilted a bit)
        # geom_plane = create_plane( 20, dep, arr)
        # # Compute emissions factors
        # gdf = compute_ef_world(gdf, geom_plane, geom_route, train, route)
        # # print(gdf[['EF_tot', 'NAME', 'colors']])
        # # print(gdf.dtypes)
        # # gdf = gdf.astype({"EF_tot":'float32', 'colors':'object', 'NAME': 'string', 'geometry': 'geometry'})
        # # print(gdf.dtypes)
        # #Game changer here
        # gdf = gpd.GeoDataFrame(gdf, geometry='geometry', crs='epsg:4326')
        # #Plot bar diagramm of emission, we remove plane because the geometry is just an illustrattion and not the real distance
        # plot_div = plotly_chart(gdf[~gdf.NAME.isin(['Plane', 'Car'])], dep, arr, dist_route, train, route)
        # #print(plot_div)
        #  #default_handler = str
        # response = {'gdf' : gdf[['colors', 'geometry']].explode().to_json(),
        #             'plot_div':plot_div}
        # return response
    
        #### NEW FORM ####
        
        if request.form['mode'] == '1' : # My trip vs direct trips
            # Convert json into pandas 
            df = pd.DataFrame.from_dict(json.loads(request.form['my-trip']))

            #My trip data and geo data
            data_mytrip, geo_mytrip = compute_emissions_custom(df)
            #Direct data and geo data
            data_direct, geo_direct = compute_emissions_all(df)
            #Possible to generate a plotly json, maybe better to plot from the data directly in javascript
            graph_json, figure = bchart_1(data_mytrip, data_direct)
            response = {'gdf' : pd.concat([geo_mytrip, geo_direct])[['colors', 'geometry']].explode().to_json(),
                        'plot_div' : graph_json}
            
        if request.form['mode'] == '2' : # My trip vs custom trip
            # Convert json into pandas 
            df = pd.DataFrame.from_dict(json.loads(request.form['my-trip']))
            df2 = pd.DataFrame.from_dict(json.loads(request.form['alternative-trip']))

            #My trip data and geo data
            data_mytrip, geo_mytrip = compute_emissions_custom(df)
            #Direct data and geo data
            data_alternative, geo_alternative = compute_emissions_custom(df2)
            #Possible to generate a plotly json
            graph_json, figure = bchart_2(data_mytrip, data_alternative)
            response = {'gdf' : pd.concat([geo_mytrip, geo_alternative])[['colors', 'geometry']].explode().to_json(),
                        'plot_div' : graph_json}
            
        return response
    
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host="localhost", port=8000, debug=False)
