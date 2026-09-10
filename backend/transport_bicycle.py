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

from http import HTTPStatus
import logging
import os

import requests
from shapely.geometry import LineString

from geo_validate_geometry import validate_geometry
from models import (
    BicycleStepData,
    EmissionPart,
    ExternalServiceDownError,
    RouteNotFoundError,
    RouteResult,
    TripPoint,
    TripStepGeometry,
    TripStepResult,
    TripType,
)
from utils import m_to_km


logger = logging.getLogger(__name__)


# Bicycle manufacturing emissions (kgCO2e/km).
# Source: European Cyclists' Federation, 2024.
# https://ecf.com/news-and-events/news/how-much-co2-does-cycling-really-save
EF_BICYCLE_MANUFACTURING = 0.005

API_KEY = os.environ.get("BICYCLE_API_KEY")
OPEN_ROUTE_SERVICE = "https://api.openrouteservice.org/v2/directions/cycling-regular"


def find_bicycle_route(
    departure: TripPoint,
    arrival: TripPoint,
) -> RouteResult:
    """Fetches a bicycle route between two geographic coordinates using
    the OpenRouteService API.

    Args:
        departure: Departure TripPoint.
        arrival: Arrival TripPoint.

    Returns:
        A RouteResult containing the route geometry and path length.

    Raises:
        RouteNotFoundError:
            If no bicycle route could be found.
        ExternalServiceDownError:
            If open_route_service doesn't answer.

    """
    departure_coords = (departure.lon, departure.lat)
    arrival_coords = (arrival.lon, arrival.lat)

    try:
        logger.info("Request bicycle route to open route service.")
        response = requests.get(
            f"{OPEN_ROUTE_SERVICE}?api_key={API_KEY}&start={departure_coords[0]},{departure_coords[1]}&end={arrival_coords[0]},{arrival_coords[1]}",
            timeout=(3, 10),
        )
    except requests.exceptions.Timeout as err:
        logger.warning("Request timeout.")
        raise ExternalServiceDownError("open_route_service") from err

    if response.status_code != HTTPStatus.OK:
        logger.warning("Request failed with status %s.", response.status_code)
        raise RouteNotFoundError(
            departure.location,
            arrival.location,
            "bicycle",
        )

    # Simplify the geometry
    route = response.json()["features"][0]
    route_geometry = LineString(route["geometry"]["coordinates"]).simplify(
        0.05,
        preserve_topology=False,
    )
    route_length = m_to_km(route["properties"]["summary"]["distance"])

    return RouteResult(geometry=route_geometry, path_length_km=route_length)


def compute_bicycle_trip(
    departure: TripPoint,
    arrival: TripPoint,
    trip_type: TripType,
) -> TripStepResult:
    """Computes a bicycle trip between two coordinates.

    Finds a bicycle route with OPEN_ROUTE_SERVICE, validates its geometry,
    and computes the associated transport emissions.

    Args:
        departure: Departure TripPoint.
        arrival: Arrival TripPoint.
        trip_type: Type of trip to compute.

    Returns:
        A ``TripStepResult`` containing the route geometry and emissions data

    """
    departure_coords = (departure.lon, departure.lat)
    arrival_coords = (arrival.lon, arrival.lat)

    result = find_bicycle_route(departure, arrival)

    try:
        validate_geometry(departure_coords, arrival_coords, result.geometry)
    except Exception as err:
        raise RouteNotFoundError(
            departure.location,
            arrival.location,
            "bicycle",
        ) from err

    route_length = result.path_length_km

    return TripStepResult(
        step_data=BicycleStepData(
            transport="bicycle",
            emissions=[
                EmissionPart(
                    name="bikeBuild",
                    kg_co2_eq=round(EF_BICYCLE_MANUFACTURING * route_length, 2),
                    distance=round(route_length),
                    ef_tot=EF_BICYCLE_MANUFACTURING,
                ),
            ],
            path_length=round(route_length),
            coeff_upstream=EF_BICYCLE_MANUFACTURING,
        ),
        geometries=[
            TripStepGeometry(
                coordinates=[[list(coord) for coord in result.geometry.coords]],
                routing_mode="bicycle",
                length=route_length,
                country_label=None,
                trip_type=trip_type,
            ),
        ],
    )
