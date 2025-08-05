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

# Librairies
import os
import warnings

from dotenv import load_dotenv
from flask import (
    abort,
    Flask,
    jsonify,
    request,
)
from flask_cors import CORS
import requests

from backend import compute_custom_trip_emissions, compute_direct_trips_emissions
from parameters import colors_alternative
from utils import extract_path_steps_from_payload


# Load the environment variables
load_dotenv()
warnings.filterwarnings("ignore")

app = Flask(__name__, static_url_path="", static_folder="frontend/build")
CORS(app)  # comment this on deployment
# app.config["DEBUG"] = True
app.config["APPLICATION_ROOT"] = "/"


@app.route("/", methods=["GET", "POST"])
def main():
    if request.method == "POST":
        data = request.get_json()

        if "main-trip" not in data:
            abort(400, "You should provide a main trip")

        ## Compute emisssions of the main custom trip
        main_trip_inputs = extract_path_steps_from_payload(data["main-trip"])
        main_trip, main_trip_geometries = compute_custom_trip_emissions(
            "MAIN_TRIP",
            main_trip_inputs,
        )

        trips = [main_trip]
        geometries = main_trip_geometries

        ### If alternative trip is provided, compute the emissions of the alternative trip
        if "second-trip" in data:
            alternative_trip_inputs = extract_path_steps_from_payload(
                data["second-trip"],
            )
            second_trip, second_trip_geometries = compute_custom_trip_emissions(
                "SECOND_TRIP",
                alternative_trip_inputs,
                cmap=colors_alternative,
            )
            trips = [main_trip, second_trip]
            geometries += second_trip_geometries

        ### If the custom trip has exaclty 1 step, compute the direct trips with other means of transport
        elif len(main_trip_inputs) == 2:
            direct_trips, direct_trips_geometries = compute_direct_trips_emissions(
                main_trip_inputs,
            )
            geometries += direct_trips_geometries
            trips = [main_trip, *direct_trips]

        return {
            "trips": trips,
            "geometries": geometries,
        }

    return {"message": "backend initialized"}


@app.route("/send-mail", methods=["POST"])
def send_mail():
    data = request.get_json()
    sender_email = data.get("sender_email")
    subject = data.get("subject")
    message = data.get("message")

    EMAIL_API_SERVICE_URL = os.getenv("EMAIL_API_SERVICE_URL")
    EMAIL_API_SERVICE_KEY = os.getenv("EMAIL_API_SERVICE_KEY")
    LOWTRIP_MANAGER_EMAIL = os.getenv("LOWTRIP_MANAGER_EMAIL")

    try:
        # To send an email with Brevo, the sender's email address must be validated.
        # Since we can't validate the email addresses of users who try to contact us in advance,
        # we use our own email as the sender and set the user's email in the 'replyTo' field.
        data = {
            "sender": {"email": LOWTRIP_MANAGER_EMAIL},
            "to": [{"email": LOWTRIP_MANAGER_EMAIL}],
            "replyTo": {"email": sender_email},
            "subject": subject,
            "htmlContent": f"Message envoyé par {sender_email}:<br/><br/>{message}",
        }

        headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
            "api-key": EMAIL_API_SERVICE_KEY,
        }

        response = requests.post(EMAIL_API_SERVICE_URL, json=data, headers=headers)
        response.raise_for_status()
        return jsonify({"status": "success", "message": "Email envoyé"}), 200

    except Exception as e:  # noqa: BLE001
        print("Erreur lors de l'envoi de l'email :", e)
        return jsonify({"error": "Erreur lors de la requête à Brevo"}), 400


if __name__ == "__main__":
    app.run(host="localhost", port=8000, debug=False)
