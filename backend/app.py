import warnings

warnings.filterwarnings("ignore")

# Librairies
from flask import Flask, request, send_from_directory, json
from backend import (
    compute_emissions_custom,
    compute_emissions_all,
    chart_refactor,
    colors_alternative,
)
from flask_cors import CORS  # comment this on deployment
import pandas as pd

print(pd.__version__)

# Application
app = Flask(__name__, static_url_path="", static_folder="frontend/build")
CORS(app)  # comment this on deployment
# app.config["DEBUG"] = True
app.config["APPLICATION_ROOT"] = "/"
# Geometry - To send to the frontend
l_geo = ["colors", "Mean of Transport", "geometry"]


@app.route("/", methods=["GET", "POST"])
def main():
    if request.method == "POST":

        #### NEW FORM ####

        if request.form["mode"] == "1":  # My trip vs direct trips
            # Convert json into pandas
            df = pd.DataFrame.from_dict(json.loads(request.form["my-trip"]))
            print(df)
            # My trip data and geo data
            data_mytrip, geo_mytrip, error = compute_emissions_custom(df)
            # Error message - for now in the console
            if len(error) > 0:
                print("My trip - ", error)
                
            if not df.shape[0] > 2 :
                # Direct data and geo data
                data_direct, geo_direct = compute_emissions_all(df)
            else :
                data_direct, geo_direct = pd.DataFrame(), pd.DataFrame()
                
            # Prepare data for aggregation in the chart -  see frontend
            data_mytrip = chart_refactor(data_mytrip)
            
            if len(error) > 0:
                error = 'My trip: '+error
            
            #Check if gdf is empty
            gdf = pd.concat([geo_direct, geo_mytrip])
            if gdf.shape[0] == 0:
                gdf = None
            else :
                gdf = gdf[l_geo].explode().to_json()
                

            # Response
            response = {
                "gdf": gdf,
                "my_trip": data_mytrip.to_json(orient="records"),
                "direct_trip": data_direct.to_json(orient="records"),
                "error": error,
            }

        if request.form["mode"] == "2":  # My trip vs custom trip
            # Convert json into pandas
            df = pd.DataFrame.from_dict(json.loads(request.form["my-trip"]))
            df2 = pd.DataFrame.from_dict(json.loads(request.form["alternative-trip"]))

            # My trip data and geo data
            data_mytrip, geo_mytrip, error = compute_emissions_custom(df)
            # Error message
            if len(error) > 0:
                error = 'My trip: '+error
            # Direct data and geo data
            # We change the color to pink
            data_alternative, geo_alternative, error_other = compute_emissions_custom(
                df2, cmap=colors_alternative
            )
            # Error message
            if len(error_other) > 0:
                error_other = 'Other trip: ' + error_other
                
            #Check if we have geo data :
            if (len(error) > 0) & (len(error_other) > 0):
                gdf = None
            else :
                gdf = pd.concat([geo_mytrip, geo_alternative])[l_geo].explode().to_json()
           
            # Prepare data for aggregation in the chart -  see frontend
            data_mytrip, data_alternative = chart_refactor(
                data_mytrip, data_alternative, True
            )

            # Response
            response = {
                "gdf": gdf,
                "my_trip": data_mytrip.to_json(orient="records"),
                "alternative_trip": data_alternative.to_json(orient="records"),
                "error": error + error_other,
            }

        return response

    return {"message": "backend initialized"}


if __name__ == "__main__":
    app.run(host="localhost", port=8000, debug=False)
