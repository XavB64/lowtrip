#import warnings
#warnings.filterwarnings('ignore')

#Librairies
from flask import Flask, request, render_template
from backend import *

print(pd.__version__)

# Application
app = Flask(__name__)
# app.config["DEBUG"] = True
app.config["APPLICATION_ROOT"] = "/"


@app.route('/', methods=["GET", "POST"])
def main():
    if request.method == "POST":
        # Converting lat lon coordinates in ggod format
        dep, arr = [float(k) for k in request.form["departure_coord"].split(',')[::-1]], [float(k) for k in request.form["arrival_coord"].split(',')[::-1]]
        print(dep, arr)
        # Request the pathway between dep and arr with coordinates
        gdf, geom_route, dist_route, route, train = query_ntag(dep, arr)
        print('Train ', train)
        print('Route', route)
        if train :
            # Apply a mask to get the relevant country
            gdf = filter_countries_world(gdf)
            print(gdf.NAME)
        # Create plane path geometry (straight line tilted a bit)
        geom_plane = create_plane(.3, 20, dep, arr)
        # Compute emissions factors
        gdf = compute_ef_world(gdf, geom_plane, geom_route, train, route)
        # print(gdf[['EF_tot', 'NAME', 'colors']])
        # print(gdf.dtypes)
        # gdf = gdf.astype({"EF_tot":'float32', 'colors':'object', 'NAME': 'string', 'geometry': 'geometry'})
        # print(gdf.dtypes)
        #Game changer here
        gdf = gpd.GeoDataFrame(gdf, geometry='geometry', crs='epsg:4326')
        #Plot bar diagramm of emission, we remove plane because the geometry is just an illustrattion and not the real distance
        plot_div = plotly_chart(gdf[~gdf.NAME.isin(['Plane', 'Car'])], dep, arr, dist_route, train, route)
        #print(plot_div)
         #default_handler = str
        response = {'gdf' : gdf[['colors', 'geometry']].to_json(),
                    'plot_div':plot_div}
        return response
    return render_template('input.html')

# if __name__ == '__main__':
#     app.run(host="localhost", port=200, debug=True)
