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
from utils import filter_countries_world, validate_geom as validate_geometry


OSM_ROUTER_URL = "http://router.project-osrm.org/route/v1/driving"


def find_route(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
):
    """Find road path between 2 points
    parameters:
        - departure_coords, arrival_coords : list or tuple like ; (lon, lat).

    Return:
    ------
        - route_geometry : shapely geometry linestring
        - route_length : float, distance in km
        - success : boolean

    """
    response = requests.get(
        f"{OSM_ROUTER_URL}/{departure_coords[0]},{departure_coords[1]};{arrival_coords[0]},{arrival_coords[1]}?overview={route_s}&geometries=geojson",
    )

    if response.status_code != HTTPStatus.OK:
        route_geometry, route_length, success = None, None, False
        return route_geometry, route_length, success

    route = response.json()["routes"][0]
    route_geometry = LineString(
        route["geometry"]["coordinates"],
    )
    route_length = route["distance"] / 1e3  # In km
    success = True

    return route_geometry, route_length, success


def ecar_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    passengers_nb=1,
    validate=val_perimeter,
    color_usage="#ffffff",
    color_cons="#ffffff",
):
    """Parameters
        - departure_coords, arrival_coords
        - validate
        - colormap, list of colors
    return:
        - full dataframe for trains.

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success or not validate_geometry(
        departure_coords,
        arrival_coords,
        route_geometry,
        validate,
    ):
        return pd.DataFrame(), pd.DataFrame(), False

    # We need to filter by country and add length / Emission factors
    gdf = filter_countries_world(
        gpd.GeoSeries(route_geometry, crs="epsg:4326"),
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
    # print("Rescaling factor", route_length / gdf["path_length"].sum())
    gdf["path_length"] *= route_length / gdf["path_length"].sum()
    # Handle nb passengers
    passengers_nb = int(passengers_nb)
    # Compute emissions : EF * length
    gdf["EF_tot"] = (
        gdf["EF_tot"]
        * EF_ecar["fuel"]
        * (1 + 0.04 * (passengers_nb - 1))
        / (1e3 * passengers_nb)
    )  # g/kWh * kWh/km
    gdf["kgCO2eq"] = gdf["path_length"] * gdf["EF_tot"]
    # Add infra and construction
    gdf = pd.concat([
        pd.DataFrame({
            "kgCO2eq": [route_length * EF_ecar["construction"] / passengers_nb],
            "EF_tot": [EF_ecar["construction"]],
            "colors": [color_cons],
            "NAME": ["Construction"],
        }),
        gdf,
    ])
    name = str(passengers_nb) + "p."
    gdf["Mean of Transport"] = ["eCar " + name for k in range(gdf.shape[0])]
    gdf["label"] = "Road"
    gdf["length"] = str(int(route_length)) + "km (" + gdf["NAME"] + ")"
    gdf["NAME"] = " " + gdf["NAME"]
    gdf.reset_index(inplace=True)
    data_ecar = gdf[["kgCO2eq", "colors", "NAME", "Mean of Transport"]]
    geo_ecar = gdf[["colors", "label", "geometry", "length"]].dropna(axis=0)

    return data_ecar, geo_ecar, success


def get_car_emissions(
    route_length: float,
    EF_fuel: float,
    EF_construction: float,
    color_usage: str,
    color_construction: str,
    passengers_label: str,
):
    return pd.DataFrame({
        "kgCO2eq": [route_length * EF_fuel, route_length * EF_construction],
        "EF_tot": [EF_fuel, EF_construction],
        "path_length": [route_length, route_length],
        "colors": [color_usage, color_construction],
        "NAME": ["Fuel", "Construction"],
        "Mean of Transport": [f"Car {passengers_label}", f"Car {passengers_label}"],
    })[::-1]


def get_bus_emissions(
    route_length: float,
    EF_fuel: float,
    EF_construction: float,
    color_usage: str,
    color_construction: str,
):
    return pd.DataFrame({
        "kgCO2eq": [
            route_length * EF_fuel,
            route_length * EF_construction,
        ],
        "EF_tot": [EF_fuel, EF_construction],
        "path_length": [route_length, route_length],
        "colors": [color_usage, color_construction],
        "NAME": ["Fuel", "Construction"],
        "Mean of Transport": ["Bus", "Bus"],
    })[::-1]


def car_bus_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    EF_car=EF_car,
    EF_bus=EF_bus,
    validate=val_perimeter,
    color_usage="#ffffff",
    color_cons="#ffffff",
):
    """ONLY FOR FIRST FORM (optimization).

    Parameters
    ----------
        - departure_coords, arrival_coords
        - EF_car, float emission factor for one car by km
        - EF_bus, float emission factor for bus by pkm
        - color, color in hex of path and bar chart
        - validate
    return:
        - full dataframe for car and bus, geometry only on car

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success or not validate_geometry(
        departure_coords,
        arrival_coords,
        route_geometry,
        validate,
    ):
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), False

    data_car = get_car_emissions(
        route_length,
        EF_car["fuel"],
        EF_car["construction"],
        color_usage,
        color_cons,
        "1p.",
    )
    # geo_car
    geo_car = pd.DataFrame(
        pd.Series({
            "colors": color_usage,
            "label": "Road",
            "length": str(int(route_length)) + "km",
            "geometry": route_geometry,
        }),
    ).transpose()

    data_bus = get_bus_emissions(
        route_length,
        EF_bus["fuel"],
        EF_bus["construction"],
        color_usage,
        color_cons,
    )

    return data_car, geo_car, data_bus, success


def bus_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    EF_bus=EF_bus,
    validate=val_perimeter,
    color_usage="#ffffff",
    color_cons="#ffffff",
):
    """Parameters
        - departure_coords, arrival_coords
        - EF_bus, float emission factor for bus by pkm
        - color, color in hex of path and bar chart
        - validate

    Return:
    ------
        - full dataframe for bus

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success or not validate_geometry(
        departure_coords,
        arrival_coords,
        route_geometry,
        validate,
    ):
        return pd.DataFrame(), pd.DataFrame(), False

    data_bus = get_bus_emissions(
        route_length,
        EF_bus["fuel"],
        EF_bus["construction"],
        color_usage,
        color_cons,
    )

    # geo_bus
    geo_bus = pd.DataFrame(
        pd.Series({
            "colors": color_usage,
            "label": "Road",
            "length": str(int(route_length)) + "km",
            "geometry": route_geometry,
        }),
    ).transpose()

    return data_bus, geo_bus, success


def car_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    EF_car=EF_car,
    validate=val_perimeter,
    passengers_nb=1,
    color_usage="#ffffff",
    color_cons="#ffffff",
):
    """Parameters
        - departure_coords, arrival_coords
        - EF_car, float emission factor for one car by km
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip).

    Return:
    ------
        - full dataframe for car

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success or not validate_geometry(
        departure_coords,
        arrival_coords,
        route_geometry,
        validate,
    ):
        return pd.DataFrame(), pd.DataFrame(), False

    if passengers_nb != "👍":
        passengers_nb = int(passengers_nb)
        EF_fuel = EF_car["fuel"] * (1 + 0.04 * (passengers_nb - 1)) / passengers_nb
        EF_cons = EF_car["construction"] / passengers_nb
        name = str(passengers_nb) + "p."
    else:  # Hitch-hiking
        EF_fuel = EF_car["fuel"] * 0.04
        EF_cons = 0
        name = "👍"

    data_car = get_car_emissions(
        route_length,
        EF_fuel,
        EF_cons,
        color_usage,
        color_cons,
        name,
    )
    # geo_car
    geo_car = pd.DataFrame(
        pd.Series({
            "colors": color_usage,
            "label": "Road",
            "length": str(int(route_length)) + "km",
            "geometry": route_geometry,
        }),
    ).transpose()

    return data_car, geo_car, success
