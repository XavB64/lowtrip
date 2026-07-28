from collections.abc import Callable
from functools import wraps
import logging
import os
import time
from typing import ParamSpec, TypeVar

from flask import make_response
import requests


logger = logging.getLogger(__name__)


def send_analytics(params: dict):
    MEASUREMENT_ID = os.getenv("GA_MEASUREMENT_ID")
    API_SECRET = os.getenv("GA_API_SECRET")

    if not MEASUREMENT_ID or not API_SECRET:
        return

    payload = {
        "client_id": "metrics",
        "events": [
            {
                "name": "carbon_calculation",
                "params": params,
            }
        ],
    }

    requests.post(
        "https://www.google-analytics.com/mp/collect",
        params={
            "measurement_id": MEASUREMENT_ID,
            "api_secret": API_SECRET,
        },
        json=payload,
        timeout=2,
    )


P = ParamSpec("P")
R = TypeVar("R")


def track_metrics(view: Callable[P, R]) -> Callable[P, R]:
    @wraps(view)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        start = time.perf_counter()

        response = view(*args, **kwargs)

        response = make_response(response)

        duration_ms = round((time.perf_counter() - start) * 1000)

        try:
            send_analytics(
                {
                    "status": response.status_code,
                    "success": response.status_code < 400,
                    "duration_ms": duration_ms,
                }
            )
        except Exception:
            logger.exception("Failed to send analytics")

        return response

    return wrapper
