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

            # My trip data and geo data
            data_mytrip, geo_mytrip, error = compute_emissions_custom(df)
            # Error message - for now in the console
            if len(error) > 0:
                print("My trip - ", error)
            # Direct data and geo data
            data_direct, geo_direct = compute_emissions_all(df)
            # Prepare data for aggregation in the chart -  see frontend
            data_mytrip = chart_refactor(data_mytrip)

            # Response
            response = {
                "gdf": pd.concat([geo_mytrip, geo_direct])[l_geo].explode().to_json(),
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
                print("My trip - ", error)
            # Direct data and geo data
            # We change the color to pink
            data_alternative, geo_alternative, error_other = compute_emissions_custom(
                df2, cmap=colors_alternative
            )
            # Error message
            if len(error_other) > 0:
                print("Other trip - ", error_other)
            if (len(error) > 0) & (len(error_other) > 0):
                print(
                    "Both customize trip failed, please change mean of transport or locations."
                )
            # Prepare data for aggregation in the chart -  see frontend
            data_mytrip, data_alternative = chart_refactor(
                data_mytrip, data_alternative, True
            )

            # Response
            response = {
                "gdf": pd.concat([geo_mytrip, geo_alternative])[l_geo]
                .explode()
                .to_json(),
                "my_trip": data_mytrip.to_json(orient="records"),
                "alternative_trip": data_alternative.to_json(orient="records"),
            }

        return response

    return {"message": "backend initialized"}


if __name__ == "__main__":
    app.run(host="localhost", port=8000, debug=False)
