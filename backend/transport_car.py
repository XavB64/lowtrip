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

import geopandas as gpd
import pandas as pd
from pyproj import Geod
import requests
from shapely.geometry import LineString

from parameters import (
    EF_bus,
    EF_car,
    EF_ecar,
    route_s,
    val_perimeter,
)
from utils import filter_countries_world, validate_geom


def find_route(tag1, tag2):
    """Find road path between 2 points
    parameters:
        - tag1, tag2 : list or tuple like ; (lon, lat).

    Return:
    ------
        - geom_route : shapely geometry linestring
        - route_dist : float, distance in km
        - route : boolean

    """
    ### Route OSRM - create a separate function
    url = (
        "http://router.project-osrm.org/route/v1/driving/"
        + str(tag1[0])
        + ","
        + str(tag1[1])
        + ";"
        + str(tag2[0])
        + ","
        + str(tag2[1])
        + "?overview="
        + route_s
        + "&geometries=geojson"
    )
    response = requests.get(url)
    if response.status_code == HTTPStatus.OK:
        geom = response.json()["routes"][0]["geometry"]
        geom_route = LineString(geom["coordinates"])  # convert.decode_polyline(geom)
        route_dist = response.json()["routes"][0]["distance"] / 1e3  # In km
        route = True
    else:
        geom_route, route_dist, route = None, None, False

    return geom_route, route_dist, route


def ecar_to_gdf(
    tag1,
    tag2,
    nb=1,
    validate=val_perimeter,
    color_usage="#ffffff",
    color_cons="#ffffff",
):  # charte_mollow
    """Parameters
        - tag1, tag2
        - perims
        - validate
        - colormap, list of colors
    return:
        - full dataframe for trains.

    """
    # Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            # gdf, geom_route, route_dist, route = pd.DataFrame(), None, None, False
            return pd.DataFrame(), pd.DataFrame(), False

        # We need to filter by country and add length / Emission factors
        gdf = filter_countries_world(
            gpd.GeoSeries(geom_route, crs="epsg:4326"),
            method="ecar",
        )

        # Add colors
        gdf["colors"] = color_usage

        l_length = []
        # Compute the true distance
        geod = Geod(ellps="WGS84")
        for geom in gdf.geometry.values:
            l_length.append(geod.geometry_length(geom) / 1e3)
        # Add the distance to the dataframe
        gdf["path_length"] = l_length
        # Rescale the length with route_dist (especially when simplified = True)
        print("Rescaling factor", route_dist / gdf["path_length"].sum())
        gdf["path_length"] *= route_dist / gdf["path_length"].sum()
        # Handle nb passengers
        nb = int(nb)
        # Compute emissions : EF * length
        gdf["EF_tot"] = (
            gdf["EF_tot"] * EF_ecar["fuel"] * (1 + 0.04 * (nb - 1)) / (1e3 * nb)
        )  # g/kWh * kWh/km
        gdf["kgCO2eq"] = gdf["path_length"] * gdf["EF_tot"]
        # Add infra and construction
        gdf = pd.concat([
            pd.DataFrame({
                "kgCO2eq": [route_dist * EF_ecar["construction"] / nb],
                "EF_tot": [EF_ecar["construction"]],
                "colors": [color_cons],
                "NAME": ["Construction"],
            }),
            gdf,
        ])
        name = str(nb) + "p."
        gdf["Mean of Transport"] = ["eCar " + name for k in range(gdf.shape[0])]
        gdf["label"] = "Road"
        gdf["length"] = str(int(route_dist)) + "km (" + gdf["NAME"] + ")"
        gdf["NAME"] = " " + gdf["NAME"]
        gdf.reset_index(inplace=True)
        data_ecar = gdf[["kgCO2eq", "colors", "NAME", "Mean of Transport"]]
        geo_ecar = gdf[["colors", "label", "geometry", "length"]].dropna(axis=0)
        # Returning the result
        return data_ecar, geo_ecar, route

    return pd.DataFrame(), pd.DataFrame(), False


def car_bus_to_gdf(
    tag1,
    tag2,
    EF_car=EF_car,
    EF_bus=EF_bus,
    validate=val_perimeter,
    color_usage="#ffffff",
    color_cons="#ffffff",
):
    """ONLY FOR FIRST FORM (optimization).

    Parameters
    ----------
        - tag1, tag2
        - EF_car, float emission factor for one car by km
        - EF_bus, float emission factor for bus by pkm
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip)
    return:
        - full dataframe for car and bus, geometry only on car

    """
    # Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    if route:
        # data_car
        data_car = pd.DataFrame({
            "kgCO2eq": [
                route_dist * EF_car["fuel"],
                route_dist * EF_car["construction"],
            ],
            "EF_tot": [EF_car["fuel"], EF_car["construction"]],
            "path_length": [route_dist, route_dist],
            "colors": [color_usage, color_cons],
            "NAME": ["Fuel", "Construction"],
            "Mean of Transport": ["Car 1p." for k in range(2)],
        })[::-1]
        # geo_car
        geo_car = pd.DataFrame(
            pd.Series({
                "colors": color_usage,
                "label": "Road",
                "length": str(int(route_dist)) + "km",
                "geometry": geom_route,
            }),
        ).transpose()
        # data_bus
        data_bus = pd.DataFrame({
            "kgCO2eq": [
                route_dist * EF_bus["fuel"],
                route_dist * EF_bus["construction"],
            ],
            "EF_tot": [EF_bus["fuel"], EF_bus["construction"]],
            "path_length": [route_dist, route_dist],
            "colors": [color_usage, color_cons],
            "NAME": ["Fuel", "Construction"],
            "Mean of Transport": ["Bus" for k in range(2)],
        })[::-1]
    else:
        data_car, geo_car, data_bus = pd.DataFrame(), pd.DataFrame(), pd.DataFrame()
    return data_car, geo_car, data_bus, route


def bus_to_gdf(
    tag1,
    tag2,
    EF_bus=EF_bus,
    validate=val_perimeter,
    color_usage="#ffffff",
    color_cons="#ffffff",
):
    """Parameters
        - tag1, tag2
        - EF_bus, float emission factor for bus by pkm
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip).

    Return:
    ------
        - full dataframe for bus

    """
    # Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    if route:
        # data_bus
        data_bus = pd.DataFrame({
            "kgCO2eq": [
                route_dist * EF_bus["fuel"],
                route_dist * EF_bus["construction"],
            ],
            "EF_tot": [EF_bus["fuel"], EF_bus["construction"]],
            "path_length": [route_dist, route_dist],
            "colors": [color_usage, color_cons],
            "NAME": ["Fuel", "Construction"],
            "Mean of Transport": ["Bus" for k in range(2)],
        })[::-1]
        # geo_bus
        geo_bus = pd.DataFrame(
            pd.Series({
                "colors": color_usage,
                "label": "Road",
                "length": str(int(route_dist)) + "km",
                "geometry": geom_route,
            }),
        ).transpose()

    else:
        data_bus, geo_bus = pd.DataFrame(), pd.DataFrame()
    return data_bus, geo_bus, route


def car_to_gdf(
    tag1,
    tag2,
    EF_car=EF_car,
    validate=val_perimeter,
    nb=1,
    color_usage="#ffffff",
    color_cons="#ffffff",
):
    """Parameters
        - tag1, tag2
        - EF_car, float emission factor for one car by km
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip).

    Return:
    ------
        - full dataframe for car

    """
    # Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)
    if nb != "👍":
        nb = int(nb)
        EF_fuel = EF_car["fuel"] * (1 + 0.04 * (nb - 1)) / nb
        EF_cons = EF_car["construction"] / nb
        # _EF_infra = EF_car['infra'] /nb
        name = str(nb) + "p."
    else:  # Hitch-hiking
        EF_fuel = EF_car["fuel"] * 0.04
        EF_cons, _EF_infra = 0, 0
        name = "👍"  # 'HH'

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    if route:
        # data car
        data_car = pd.DataFrame({
            "kgCO2eq": [route_dist * EF_fuel, route_dist * EF_cons],
            "EF_tot": [EF_fuel, EF_cons],
            "path_length": [route_dist, route_dist],
            "colors": [color_usage, color_cons],
            "NAME": ["Fuel", "Construction"],
            "Mean of Transport": ["Car " + name for k in range(2)],
        })[::-1]
        # geo_car
        geo_car = pd.DataFrame(
            pd.Series({
                "colors": color_usage,
                "label": "Road",
                "length": str(int(route_dist)) + "km",
                "geometry": geom_route,
            }),
        ).transpose()

    else:
        data_car, geo_car = pd.DataFrame(), pd.DataFrame()

    # Return the result
    return data_car, geo_car, route
