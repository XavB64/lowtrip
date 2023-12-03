#Librairies
from flask import Flask, request, render_template
from backend import *

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
        gdf, geom_route, dist_route = query_ntag(dep, arr)
        # Apply a mask to get the relevant country
        gdf = filter_countries(gdf)
        print(gdf.NAME)
        # Create plane path geometry (straight line tilted a bit)
        geom_plane = create_plane(.3, 20, dep, arr)
        # Compute emissions factors
        gdf = compute_ef(gdf, geom_plane, geom_route)

        #Plot bar diagramm of emission, we remove plane because the geometry is just an illustrattion and not the real distance
        plot_div = plotly_chart(gdf[~gdf.NAME.isin(['Plane', 'Car'])], dep, arr, dist_route)
        #print(plot_div)
        response = {'gdf' : gdf[['geometry', 'colors']].to_json(),
                    'plot_div':plot_div}
        return response
    return render_template('input.html')

# if __name__ == '__main__':
#     app.run(host="localhost", port=200, debug=True)
