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

import logging
import os
import warnings

from dotenv import load_dotenv
from flask import (
    Flask,
    json,
    jsonify,
    request,
)
from flask_cors import CORS
from pydantic import ValidationError
import requests

from models import ApiPayload
from trip_service import compute_emissions


# Load the environment variables
load_dotenv()
warnings.filterwarnings("ignore")

app = Flask(__name__, static_url_path="", static_folder="frontend/build")
CORS(app)  # comment this on deployment
# app.config["DEBUG"] = True
app.config["APPLICATION_ROOT"] = "/"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)

logger = logging.getLogger(__name__)


@app.route("/health", methods=["GET"])
def health():
    return {"message": "backend initialized"}


@app.route("/compute-emissions", methods=["POST"])
def compute_emissions_endpoint():
    """Compute emissions and geometries for one or two trips.

    The request payload is validated with Pydantic before emissions are
    computed.

    If only one trip is requested and it contains a single transport step,
    additional direct trips are computed for alternative transport modes
    (train, bus, car, plane, etc.).

    Returns:
        JSON response containing:
            - trips: Computed emissions results.
            - geometries: Route geometries for visualization.

    """
    try:
        payload = ApiPayload.model_validate(request.get_json())
    except ValidationError as exc:
        logger.warning("Invalid payload received: %s", exc.errors())
        return jsonify(
            {
                "error": "Invalid payload",
                "details": exc.errors(),
            }
        ), 400

    logger.info(
        "compute_emissions_request payload=%s",
        json.dumps(payload.model_dump(), ensure_ascii=False),
    )

    return compute_emissions(payload)


@app.route("/send-mail", methods=["POST"])
def send_mail():
    data = request.get_json()
    logger.info("send_mail payload=%s", data)

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
        return jsonify({"status": "success", "message": "Email sent"}), 200

    except Exception:
        logger.exception("Sending email failed: %s")
        return jsonify({"error": "Erreur lors de la requête à Brevo"}), 400


if __name__ == "__main__":
    app.run(host="localhost", port=8000, debug=False)
