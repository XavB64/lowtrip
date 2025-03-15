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
    EmissionPart,
    StepData,
    TripStepGeometry,
    TripStepResult,
)
from parameters import EF_bicycle, val_perimeter
from utils import validate_geom


API_KEY = os.environ.get("BICYCLE_API_KEY")
OPEN_ROUTE_SERVICE = "https://api.openrouteservice.org/v2/directions/cycling-regular"


def find_bicycle(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
):
    ### Open route service
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

    # print(f"Bicycle length: {round(route_length, 1)}km")

    return route_geometry, True, route_length


def bicycle_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    EF=EF_bicycle,
    color="#ffffff",
    validate=val_perimeter,
) -> TripStepResult | None:
    """Parameters
        - departure_coords, arrival_coords
        - EF_bus, float emission factor for bike by pkm
        - color, color in hex of path and bar chart
        - validate

    Return:
    ------
        - TripStepResult or None

    """
    # Route OSRM - create a separate function
    route_geometry, success, route_length = find_bicycle(
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
        step_data=StepData(
            transport_means="Bicycle",
            emissions=[
                EmissionPart(
                    name="Construction",
                    kg_co2_eq=EF * route_length,
                    ef_tot=EF,
                    color=color,
                ),
            ],
            path_length=route_length,
        ),
        geometries=[
            TripStepGeometry(
                coordinates=[[list(coord) for coord in route_geometry.coords]],
                transport_means="Bicycle",
                length=route_length,
                color=color,
                country_label=None,
            ),
        ],
    )
