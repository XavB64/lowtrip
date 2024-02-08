import warnings

warnings.filterwarnings("ignore")

# Librairies
from flask import Flask, request, send_from_directory, json
from backend import *
from flask_cors import CORS  # comment this on deployment

print(pd.__version__)

# Application
app = Flask(__name__, static_url_path="", static_folder="frontend/build")
CORS(app)  # comment this on deployment
# app.config["DEBUG"] = True
app.config["APPLICATION_ROOT"] = "/"
# Geometry - To send to the frontend
l_geo = ["colors", "geometry"]


@app.route("/", methods=["GET", "POST"])
def main():
    if request.method == "POST":

        #### NEW FORM ####

        if request.form["mode"] == "1":  # My trip vs direct trips
            # Convert json into pandas
            df = pd.DataFrame.from_dict(json.loads(request.form["my-trip"]))

            # My trip data and geo data
            data_mytrip, geo_mytrip = compute_emissions_custom(df)

            # Direct data and geo data
            data_direct, geo_direct = compute_emissions_all(df)
            # Prepare data for aggregation in the chart -  see frontend
            data_mytrip = chart_refactor(data_mytrip)

            # Response
            response = {
                "gdf": pd.concat([geo_mytrip, geo_direct])[l_geo].explode().to_json(),
                "my_trip": data_mytrip.to_json(orient="records"),
                "direct_trip": data_direct.to_json(orient="records"),
            }

        if request.form["mode"] == "2":  # My trip vs custom trip
            # Convert json into pandas
            df = pd.DataFrame.from_dict(json.loads(request.form["my-trip"]))
            df2 = pd.DataFrame.from_dict(json.loads(request.form["alternative-trip"]))

            # My trip data and geo data
            data_mytrip, geo_mytrip = compute_emissions_custom(df)
            # Direct data and geo data
            # We change the color to pink
            data_alternative, geo_alternative = compute_emissions_custom(
                df2, cmap="RdPu"
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

    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(host="localhost", port=8000, debug=False)
