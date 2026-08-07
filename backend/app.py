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

from html import escape
import logging
import os
import uuid
import warnings

from dotenv import load_dotenv
from flask import (
    Flask,
    g,
    json,
    jsonify,
    request,
)
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pydantic import ValidationError
import requests
import sentry_sdk

from analytics import RequestIdFilter, track_metrics
from models import ApiPayload
from trip_service import compute_emissions


warnings.filterwarnings("ignore")

# Load the environment variables
load_dotenv()


# Application configuration
app = Flask(__name__, static_url_path="", static_folder="frontend/build")

CORS(app)
app.config["APPLICATION_ROOT"] = "/"


# Logging configuration
handler = logging.StreamHandler()
handler.addFilter(RequestIdFilter())

logging.basicConfig(
    level=logging.INFO,
    handlers=[handler],
    format=(
        "%(asctime)s %(levelname)s %(name)s [request_id=%(request_id)s] - %(message)s"
    ),
)
logger = logging.getLogger(__name__)


# Sentry for monitoring
sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"))


EMAIL_API_SERVICE_KEY = os.getenv("EMAIL_API_SERVICE_KEY")
LOWTRIP_MANAGER_EMAIL = os.getenv("LOWTRIP_MANAGER_EMAIL")


@app.route("/health", methods=["GET"])
def health():
    return {"message": "backend initialized"}


@app.route("/compute-emissions", methods=["POST"])
@track_metrics
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
        g.payload = payload
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


limiter = Limiter(key_func=get_remote_address, app=app, default_limits=[])


@app.route("/send-mail", methods=["POST"])
@limiter.limit("10 per day")
def send_mail():
    g.request_id = str(uuid.uuid4())
    sentry_sdk.set_tag("request_id", g.request_id)

    if not EMAIL_API_SERVICE_KEY:
        return jsonify(
            {
                "error": "EMAIL_INVALID_CONFIGURATION",
                "message": "API key not configured",
            }
        ), 400
    if not LOWTRIP_MANAGER_EMAIL:
        return jsonify(
            {
                "error": "EMAIL_INVALID_CONFIGURATION",
                "message": "Contact email not configured",
            }
        ), 400

    data = request.get_json()
    if not data:
        return jsonify({"error": "EMAIL_EMPTY_PAYLOAD"}), 400

    sender_email = data.get("sender_email")
    subject = data.get("subject", "")
    message = data.get("message", "")

    sender = escape(sender_email.strip()) if sender_email else "un utilisateur anonyme"
    message_html = escape(message).replace("\n", "<br>")

    if len(message) > 20000:
        return jsonify({"error": "EMAIL_MESSAGE_TOO_LONG"}), 400

    # To send an email, the sender's email address must be validated.
    # Since we can't validate the email addresses of users who try to contact us in advance,
    # we use our own email as the sender and set the user's email in the 'replyTo' field.
    data = {
        "sender": {"email": LOWTRIP_MANAGER_EMAIL},
        "to": [{"email": LOWTRIP_MANAGER_EMAIL}],
        "replyTo": {"email": sender_email} if sender_email else None,
        "subject": escape(subject),
        "htmlContent": f"Message envoyé par {sender}:<br/><br/>{message_html}",
    }

    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "accept": "application/json",
            "Content-Type": "application/json",
            "api-key": EMAIL_API_SERVICE_KEY,
        },
        json=data,
    )

    if not response.ok:
        logger.error(
            "Brevo error status=%s body=%s", response.status_code, response.text
        )
        return jsonify({"error": "EMAIL_REQUEST_FAILED", "details": response.text}), 500

    return jsonify({"status": "success", "message": "Email sent"}), 200


if __name__ == "__main__":
    app.run(host="localhost", port=8000, debug=False)
