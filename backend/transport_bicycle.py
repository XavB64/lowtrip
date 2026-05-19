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
import os

import requests
from shapely.geometry import LineString

from models import (
    BicycleStepData,
    EmissionPart,
    TripStepGeometry,
    TripStepResult,
    TripType,
)
from parameters import EF_bicycle, val_perimeter
from utils import validate_geom


API_KEY = os.environ.get("BICYCLE_API_KEY")
OPEN_ROUTE_SERVICE = "https://api.openrouteservice.org/v2/directions/cycling-regular"


def find_bicycle_route(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
):
    """Fetches a bicycle route between two geographic coordinates using
    the OpenRouteService API.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).

    Returns:
        A tuple containing:
            - simplified route geometry.
            - a boolean indicating whether a route was successfully found.
            - route distance in kilometers.

    """
    response = requests.get(
        f"{OPEN_ROUTE_SERVICE}?api_key={API_KEY}&start={departure_coords[0]},{departure_coords[1]}&end={arrival_coords[0]},{arrival_coords[1]}",
    )

    if response.status_code != HTTPStatus.OK:
        route_geometry, route, route_length = None, False, None
        return route_geometry, route, route_length

    # Simplify the geometry
    route = response.json()["features"][0]
    geometry = route["geometry"]
    route_geometry = LineString(geometry["coordinates"]).simplify(
        0.05,
        preserve_topology=False,
    )
    route_length = route["properties"]["summary"]["distance"] / 1e3  # km

    return route_geometry, True, route_length


def bicycle_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
    EF=EF_bicycle,
    validate=val_perimeter,
) -> TripStepResult | None:
    """Parameters
        - departure_coords, arrival_coords
        - EF_bus, float emission factor for bike by pkm
        - validate

    Return:
    ------
        - TripStepResult or None

    """
    route_geometry, success, route_length = find_bicycle_route(
        departure_coords,
        arrival_coords,
    )

    if not success or not validate_geom(
        departure_coords,
        arrival_coords,
        route_geometry,
        validate,
    ):
        return None

    return TripStepResult(
        step_data=BicycleStepData(
            transport="bicycle",
            emissions=[
                EmissionPart(
                    name="bikeBuild",
                    kg_co2_eq=round(EF * route_length, 2),
                    distance=round(route_length),
                    ef_tot=EF,
                ),
            ],
            path_length=round(route_length),
            coeff_upstream=EF,
        ),
        geometries=[
            TripStepGeometry(
                coordinates=[[list(coord) for coord in route_geometry.coords]],
                transport_means="bicycle",
                length=route_length,
                country_label=None,
                trip_type=trip_type,
            ),
        ],
    )
