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

from backend import (
    compute_custom_trip_emissions,
    compute_direct_trips_emissions,
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

            main_trip, geometries = compute_custom_trip_emissions("MAIN_TRIP", inputs)

            # If we have more than 1 step, we return immediately
            if len(inputs) > 2:
                return {
                    "trips": [main_trip],
                    "geometries": geometries,
                }

            # If we have exactly 1 step, then we can compare with other means of transport
            direct_trips, direct_trips_geometries = compute_direct_trips_emissions(
                inputs,
            )

            geometries += direct_trips_geometries

            trips = [main_trip, *direct_trips]

            return {
                "trips": trips,
                "geometries": geometries,
            }

        ### Compare emissions of 2 custom trips
        main_trip_inputs = extract_path_steps_from_payload(data["my-trip"])
        alternative_trip_inputs = extract_path_steps_from_payload(
            data["alternative-trip"],
        )

        main_trip, main_trip_geometries = compute_custom_trip_emissions(
            "MAIN_TRIP",
            main_trip_inputs,
        )

        second_trip, second_trip_geometries = compute_custom_trip_emissions(
            "SECOND_TRIP",
            alternative_trip_inputs,
            cmap=colors_alternative,
        )

        return {
            "trips": [main_trip, second_trip],
            "geometries": main_trip_geometries + second_trip_geometries,
        }

    return {"message": "backend initialized"}


if __name__ == "__main__":
    app.run(host="localhost", port=8000, debug=False)
