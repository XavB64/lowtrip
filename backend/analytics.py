from collections.abc import Callable
from functools import wraps
import logging
import os
import time
from typing import ParamSpec, TypeVar
import uuid

from flask import g, make_response
import requests
import sentry_sdk

from models import ApiPayload, Trip


class RequestIdFilter(logging.Filter):
    """Logging filter that injects the current request ID into log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Add the current request ID to the log record."""
        record.request_id = g.request_id or "-"
        return True


logger = logging.getLogger(__name__)


def build_trip_summary(trip: Trip, trip_type: str) -> dict:
    return {
        "type": trip_type,
        "departure": trip.departure.location,
        "arrival": trip.steps[-1].location,
        "nb_steps": len(trip.steps),
        "transports": [s.transport_mean for s in trip.steps],
        "first_transport": trip.steps[0].transport_mean,
    }


def build_trips(payload: ApiPayload) -> dict:
    trips = [build_trip_summary(payload.main_trip, "main")]
    if payload.second_trip:
        trips.append(build_trip_summary(payload.second_trip, "second"))
    return trips


def get_request_type(payload: ApiPayload):
    if payload.second_trip:
        return "comparison"
    if len(payload.main_trip.steps) == 1:
        return "single_step"
    return "multi_step"


def send_google_sheet(
    request_id: str,
    payload: ApiPayload,
    response_status_code: int,
    duration_ms: int,
) -> None:
    GOOGLE_SCRIPT_URL = os.getenv("GOOGLE_SCRIPT_URL")
    GOOGLE_SCRIPT_SECRET = os.getenv("GOOGLE_SCRIPT_SECRET")

    if not GOOGLE_SCRIPT_URL or not GOOGLE_SCRIPT_SECRET:
        return

    try:
        requests.post(
            GOOGLE_SCRIPT_URL,
            json={
                "api_key": GOOGLE_SCRIPT_SECRET,
                "request_id": request_id,
                "request_type": get_request_type(payload),
                "payload": payload.model_dump(by_alias=True),
                "status": response_status_code,
                "success": response_status_code < 400,
                "duration_ms": duration_ms,
                "trips": build_trips(payload),
            },
            timeout=10,
        )
    except Exception:
        logger.warning("Failed to send Google Sheets logs", exc_info=True)
        sentry_sdk.capture_message("Failed to send Google Sheets logs", level="warning")


def send_analytics(response_status_code: int, duration_ms: int):
    MEASUREMENT_ID = os.getenv("GA_MEASUREMENT_ID")
    API_SECRET = os.getenv("GA_API_SECRET")

    if not MEASUREMENT_ID or not API_SECRET:
        return

    payload = {
        "client_id": "metrics",
        "events": [
            {
                "name": "carbon_calculation",
                "params": {
                    "status": response_status_code,
                    "success": response_status_code < 400,
                    "duration_ms": duration_ms,
                },
            }
        ],
    }

    try:
        requests.post(
            "https://www.google-analytics.com/mp/collect",
            params={
                "measurement_id": MEASUREMENT_ID,
                "api_secret": API_SECRET,
            },
            json=payload,
            timeout=2,
        )
    except Exception:
        logger.warning("Failed to send log to GA", exc_info=True)
        sentry_sdk.capture_message("Failed to send log to GA", level="warning")


P = ParamSpec("P")
R = TypeVar("R")


def track_metrics(view: Callable[P, R]) -> Callable[P, R]:
    @wraps(view)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        g.request_id = str(uuid.uuid4())
        start = time.perf_counter()

        sentry_sdk.set_tag("request_id", g.request_id)

        status_code = 500
        try:
            response = make_response(view(*args, **kwargs))
            status_code = response.status_code
            return response

        finally:
            duration_ms = round((time.perf_counter() - start) * 1000)
            payload = getattr(g, "payload", None)

            send_analytics(status_code, duration_ms)
            send_google_sheet(g.request_id, payload, status_code, duration_ms)

    return wrapper
