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

        #### NEW FORM ####

        if request.form['mode'] == '1' : # My trip vs direct trips
            # Convert json into pandas
            df = pd.DataFrame.from_dict(json.loads(request.form['my-trip']))
          #  df.to_csv('query.csv')
            #My trip data and geo data
            data_mytrip, geo_mytrip = compute_emissions_custom(df)
           # print(data_mytrip)
            #Direct data and geo data
            data_direct, geo_direct = compute_emissions_all(df)
            #Possible to generate a plotly json, maybe better to plot from the data directly in javascript
            graph_json, figure = bchart_1(data_mytrip, data_direct)
           # pd.concat([data_mytrip, data_direct]).to_csv('see_res.csv')
            response = {'gdf' : pd.concat([geo_mytrip, geo_direct])[['colors', 'geometry']].explode().to_json(),
                        'plot_div' : graph_json}

        if request.form['mode'] == '2' : # My trip vs custom trip
            # Convert json into pandas
            df = pd.DataFrame.from_dict(json.loads(request.form['my-trip']))
            df2 = pd.DataFrame.from_dict(json.loads(request.form['alternative-trip']))

            #My trip data and geo data
            data_mytrip, geo_mytrip = compute_emissions_custom(df)
            #Direct data and geo data
            #We change the color to pink
            data_alternative, geo_alternative = compute_emissions_custom(df2, cmap = 'RdPu')
            #Possible to generate a plotly json
            graph_json, figure = bchart_2(data_mytrip, data_alternative)
            response = {'gdf' : pd.concat([geo_mytrip, geo_alternative])[['colors', 'geometry']].explode().to_json(),
                        'plot_div' : graph_json}

        return response

    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host="localhost", port=8000, debug=False)
