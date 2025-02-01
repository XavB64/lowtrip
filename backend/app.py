# Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

# Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

import warnings

# Librairies
from flask import (
    abort,
    Flask,
    request,
)
from flask_cors import CORS
import pandas as pd

from backend import (
    chart_refactor,
    compute_emissions_all,
    compute_emissions_custom,
)
from parameters import colors_alternative
from utils import extract_path_steps_from_payload


warnings.filterwarnings("ignore")

# Application
app = Flask(__name__, static_url_path="", static_folder="frontend/build")
CORS(app)  # comment this on deployment
# app.config["DEBUG"] = True
app.config["APPLICATION_ROOT"] = "/"


@app.route("/", methods=["GET", "POST"])
def main():
    if request.method == "POST":
        data = request.get_json()

        if "my-trip" not in data:
            abort(400, "My trip: you should provide a trip")

        ### Compute emissions of a single custom trip and compare it with other means of transport
        if "alternative-trip" not in data:
            inputs = extract_path_steps_from_payload(data["my-trip"])

            if len(inputs) < 2:
                abort(400, "My trip: should have at least 1 step")

            df = pd.DataFrame.from_dict(inputs)
            data_mytrip, geo_mytrip, error = compute_emissions_custom(inputs)

            if len(error) > 0:
                return {"error": f"My trip: {error}"}

            # If we have more than 1 step, we return immediately
            if len(inputs) > 2:
                return {
                    "gdf": geo_mytrip.explode().to_json(),
                    "my_trip": chart_refactor(data_mytrip).to_json(orient="records"),
                }

            # If we have exactly 1 step, then we can compare with other means of transport
            data_direct, geo_direct = compute_emissions_all(df)

            gdf = pd.concat([geo_direct, geo_mytrip]).explode().to_json()

            return {
                "gdf": gdf,
                "my_trip": data_mytrip.to_json(orient="records"),
                "direct_trip": data_direct.to_json(orient="records"),
            }

        ### Compare emissions of 2 custom trips
        main_trip_inputs = extract_path_steps_from_payload(data["my-trip"])
        alternative_trip_inputs = extract_path_steps_from_payload(
            data["alternative-trip"],
        )

        data_mytrip, geo_mytrip, error = compute_emissions_custom(main_trip_inputs)

        data_alternative, geo_alternative, error_other = compute_emissions_custom(
            alternative_trip_inputs,
            cmap=colors_alternative,
        )

        if len(error) > 0 or len(error_other) > 0:
            return {
                error: f"My trip: {error}"
                if len(error) > 0
                else f"Other trip: {error_other}",
            }

        gdf = pd.concat([geo_mytrip, geo_alternative]).explode().to_json()

        # Prepare data for aggregation in the chart -  see frontend
        data_mytrip, data_alternative = chart_refactor(
            data_mytrip,
            data_alternative,
            True,
        )

        return {
            "gdf": gdf,
            "my_trip": data_mytrip.to_json(orient="records"),
            "alternative_trip": data_alternative.to_json(orient="records"),
        }

    return {"message": "backend initialized"}


if __name__ == "__main__":
    app.run(host="localhost", port=8000, debug=False)
