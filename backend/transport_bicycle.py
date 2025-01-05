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

import pandas as pd
import requests
from shapely.geometry import LineString

from parameters import EF_bicycle, val_perimeter
from utils import validate_geom


def find_bicycle(tag1, tag2):
    ### Openrouteservie
    api_key = os.environ.get("BICYCLE_API_KEY")
    url = (
        "https://api.openrouteservice.org/v2/directions/cycling-regular?api_key="
        + api_key
        + "&start="
        + str(tag1[0])
        + ","
        + str(tag1[1])
        + "&end="
        + str(tag2[0])
        + ","
        + str(tag2[1])
    )
    response = requests.get(url)
    if response.status_code == HTTPStatus.OK:
        geom = response.json()["features"][0]["geometry"]
        geom_route = LineString(geom["coordinates"]).simplify(
            0.05,
            preserve_topology=False,
        )  # convert.decode_polyline(geom)
        route = True
        route_dist = (
            response.json()["features"][0]["properties"]["summary"]["distance"] / 1e3
        )  # km
        print("Bicycle length", round(route_dist, 1))
    else:
        geom_route, route, route_dist = None, False, None

    return geom_route, route, route_dist


def bicycle_to_gdf(tag1, tag2, EF=EF_bicycle, color="#ffffff", validate=val_perimeter):
    """Parameters
        - tag1, tag2
        - EF_bus, float emission factor for bike by pkm
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip).

    Return:
    ------
        - full dataframe for bike

    """
    # Route OSRM - create a separate function
    geom_route, route, route_dist = find_bicycle(tag1, tag2)

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route, route_dist = None, False, None

    if route:
        # Chart data
        data_bike = pd.DataFrame({
            "kgCO2eq": [EF * route_dist],
            "EF_tot": [EF],
            "path_length": [route_dist],
            "colors": [color],
            "NAME": ["Bike-build"],
            "Mean of Transport": ["Bicycle"],
        })
        # Geo_data
        gdf_bike = pd.DataFrame({
            "colors": [color],
            "label": ["Bike"],
            "length": str(int(route_dist)) + "km",
            "geometry": [geom_route],
        })

    else:
        data_bike, gdf_bike = pd.DataFrame(), pd.DataFrame()
    return data_bike, gdf_bike, route
