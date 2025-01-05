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
from typing import Tuple

import pandas as pd
import requests
from shapely.geometry import LineString

from parameters import EF_bicycle, val_perimeter
from utils import validate_geom


API_KEY = os.environ.get("BICYCLE_API_KEY")


def find_bicycle(
    departure_coords: Tuple[float, float], arrival_coords: Tuple[float, float]
):
    ### Open route service
    url = (
        "https://api.openrouteservice.org/v2/directions/cycling-regular?api_key="
        + API_KEY
        + "&start="
        + str(departure_coords[0])
        + ","
        + str(departure_coords[1])
        + "&end="
        + str(arrival_coords[0])
        + ","
        + str(arrival_coords[1])
    )
    response = requests.get(url)
    if response.status_code == HTTPStatus.OK:
        geometry = response.json()["features"][0]["geometry"]
        route_geometry = LineString(geometry["coordinates"]).simplify(
            0.05,
            preserve_topology=False,
        )  # convert.decode_polyline(geom)
        success = True
        route_length = (
            response.json()["features"][0]["properties"]["summary"]["distance"] / 1e3
        )  # km
        print("Bicycle length", round(route_length, 1))
    else:
        route_geometry, success, route_length = None, False, None

    return route_geometry, success, route_length


def bicycle_to_gdf(
    departure_coords: Tuple[float, float],
    arrival_coords: Tuple[float, float],
    EF=EF_bicycle,
    color="#ffffff",
    validate=val_perimeter,
):
    """Parameters
        - departure_coords, arrival_coords
        - EF_bus, float emission factor for bike by pkm
        - color, color in hex of path and bar chart
        - validate

    Return:
    ------
        - full dataframe for bike

    """
    # Route OSRM - create a separate function
    route_geometry, success, route_length = find_bicycle(
        departure_coords, arrival_coords
    )

    # Validation part for route
    if success:  # We have a geometry
        if not validate_geom(
            departure_coords, arrival_coords, route_geometry, validate
        ):
            route_geometry, success, route_length = None, False, None

    if success:
        # Chart data
        data_bike = pd.DataFrame({
            "kgCO2eq": [EF * route_length],
            "EF_tot": [EF],
            "path_length": [route_length],
            "colors": [color],
            "NAME": ["Bike-build"],
            "Mean of Transport": ["Bicycle"],
        })
        # Geo_data
        gdf_bike = pd.DataFrame({
            "colors": [color],
            "label": ["Bike"],
            "length": str(int(route_length)) + "km",
            "geometry": [route_geometry],
        })

    else:
        data_bike, gdf_bike = pd.DataFrame(), pd.DataFrame()
    return data_bike, gdf_bike, success
