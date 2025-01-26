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

# Need for ferry if straight line
# from shapely.geometry import LineString
from http import HTTPStatus

import geopandas as gpd
import pandas as pd
from pyproj import Geod
import requests
from shapely.geometry import LineString, Point

from parameters import (
    EF_train,
    search_perimeter,
    train_s,
    train_t,
    val_perimeter,
)
from utils import (
    filter_countries_world,
    kilometer_to_degree,
    validate_geom,
)


def flatten_list_of_tuples(lst):
    # We reverse the geometry so the latitude are written before the longitude (Overpass API nomenclature)
    return [item for tup in lst for item in tup[::-1]]


def find_nearest(lon, lat, perim):
    """This function find the nearest node for train raiway in the OSM network using Overpass API
    parameters:
        - lon, lat : coordinates in degree of the point
        - perim : perimeters (m) to look around
    return:
        - new coordinates(lat, lon).
    """
    # Extend the area around the point
    buff = list(Point(lon, lat).buffer(kilometer_to_degree(perim)).exterior.coords)
    # Request Overpass API turbo data :
    l = flatten_list_of_tuples(buff)

    # Overpass API nomenclature - filter by polygon
    st = ""
    for k in l:
        st += str(k) + " "

    # Prepare the request
    url = "http://overpass-api.de/api/interpreter"  # To avoid the natural space at the end
    query = (
        '[out:json][timeout:300];(way(poly : "'
        + st[:-1]
        + '")["railway"="rail"];);out geom;'
    )  # ;convert item ::=::,::geom=geom(),_osm_type=type()

    # Make request
    response = requests.get(url, params={"data": query})

    # if response.status_code == HTTPStatus.OK: not working, looking at size of elements also
    if response.status_code == HTTPStatus.OK and len(response.json()["elements"]) > 0:
        # Extract the first point coordinates we could found
        new_point = (
            pd.json_normalize(response.json()["elements"][0]).loc[0].geometry[0]
        )  # .columns
        # Return lon, lat
        return (new_point["lon"], new_point["lat"])

    # Couldn't find a node
    return False


def extend_search(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    perims,
):
    """Function to use when the train path is not found directly by the API.
    We search for nearby coordinates and request it again.

    Parameters
    ----------
        - departure_coords, arrival_coords : list or tuple like with coordinates (lon, lat)
        - perims : list-like ; perimeters to search for with overpass API
    return:
        - gdf (geoseries)
        - success (bool)

    """
    # We extend the search progressively
    for perim in perims:
        # Departure
        new_departure_coords = find_nearest(
            departure_coords[0],
            departure_coords[1],
            perim,
        )
        if new_departure_coords != False:
            # Then we found a better place, we can stop the loop
            break
    # Maybe here try to check if the API is not already working
    if new_departure_coords == False:
        # Then we will find nothing
        gdf = pd.DataFrame()
        success = False
        train_dist = None
    # return None, False
    else:
        # We can retry the API
        gdf, success, train_dist = find_train(new_departure_coords, arrival_coords)
        if success == False:
            # We can change arrival_coords
            for perim in perims:  # Could be up to 10k  ~ size of Bdx
                # Arrival
                new_arrival_coords = find_nearest(
                    arrival_coords[0],
                    arrival_coords[1],
                    perim,
                )
                if new_arrival_coords != False:
                    break

            # Verify that we want to try to request the API again
            if new_departure_coords and new_arrival_coords:
                gdf, success, train_dist = find_train(
                    new_departure_coords,
                    new_arrival_coords,
                )

    return gdf, success, train_dist


def find_train(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    method="signal",
):
    """Find train path between 2 points. Can use ntag API or signal.

    Parameters
    ----------
        - departure_coords, arrival_coords : list or tuple like (lon, lat)
        - method : signal / trainmap
    return:
        - geometry, a LineString or None
        - success, boolean

    """
    # format lon, lat
    # Build the request url
    if method == "trainmap":
        # trainmap
        url = (
            f"https://trainmap.ntag.fr/api/route?dep={departure_coords[0]},{departure_coords[1]}&arr={arrival_coords[0]},{arrival_coords[1]}&simplify="
            + train_t
        )  # 1 to simplify it
    else:
        # signal
        url = (
            f"https://signal.eu.org/osm/eu/route/v1/train/{departure_coords[0]},{departure_coords[1]};{arrival_coords[0]},{arrival_coords[1]}?overview="
            + train_s
            + "&geometries=geojson"
        )  # simplified
    # Send the GET request
    # import time
    # s = time.time()
    response = requests.get(url)
    # print(time.time() - s)

    # Check if the request was not successful
    if response.status_code != HTTPStatus.OK:
        print(f"Failed to retrieve data. Status code: {response.status_code}")
        geometry, success, train_dist = None, False, 0
        # We will try to request again with overpass
        return geometry, success, train_dist

    print("Path retrieved!")
    if method == "trainmap":
        geometry = LineString(response.json()["geometry"]["coordinates"][0])
    else:  # signal
        train_dist = response.json()["routes"][0]["distance"] / 1e3  # km
        geometry = LineString(response.json()["routes"][0]["geometry"]["coordinates"])

    success = True

    return geometry, success, train_dist


def train_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    perims=search_perimeter,
    EF_train=EF_train,
    validate=val_perimeter,
    color_usage="#ffffff",
    color_infra="#ffffff",
):  # charte_mollow
    """Parameters
        - departure_coords, arrival_coords
        - perims
        - validate
        - colormap, list of colors
    return:
        - full dataframe for trains.

    """
    # First try with coordinates supplied by the user
    geometry, success, train_dist = find_train(departure_coords, arrival_coords)

    # If failure then we try to find a better spot nearby - Put in another function
    if success == False:
        # We try to search nearby the coordinates and request again
        geometry, success, train_dist = extend_search(
            departure_coords,
            arrival_coords,
            perims,
        )

    # Validation part for train
    if not success or not validate_geom(
        departure_coords,
        arrival_coords,
        gpd.GeoSeries(
            geometry,
            crs="epsg:4326",
        ).values[0],
        validate,
    ):
        return pd.DataFrame(), pd.DataFrame(), False

    # We need to filter by country and add length / Emission factors
    gdf = filter_countries_world(
        geometry,
        method="train",
    )
    # Adding and computing emissions
    l_length = []
    # Compute the true distance
    geod = Geod(ellps="WGS84")
    for geom in gdf.geometry.values:
        l_length.append(geod.geometry_length(geom) / 1e3)
    # Add the distance to the dataframe
    gdf["path_length"] = l_length
    # Rescale the length with train_dist (especially when simplified = True)
    print("Rescaling factor", train_dist / gdf["path_length"].sum())
    gdf["path_length"] *= train_dist / gdf["path_length"].sum()
    # Compute emissions : EF * length
    gdf["EF_tot"] /= 1000.0  # Conversion in kg
    gdf["kgCO2eq"] = gdf["path_length"] * gdf["EF_tot"]
    # Add colors, here discretise the colormap
    gdf["colors"] = color_usage
    # Write
    gdf = pd.concat([
        pd.DataFrame({
            "kgCO2eq": [train_dist * EF_train["infra"]],
            "EF_tot": [EF_train["infra"]],
            "colors": [color_infra],
            "NAME": ["Infra"],
        }),
        gdf,
    ])

    # Add infra
    gdf["Mean of Transport"] = "Train"
    gdf["label"] = "Railway"
    gdf["length"] = str(int(train_dist)) + "km (" + gdf["NAME"] + ")"
    gdf.reset_index(inplace=True)

    data_train = gdf[["kgCO2eq", "colors", "NAME", "Mean of Transport"]]
    geo_train = gdf[["colors", "label", "geometry", "length"]].dropna(axis=0)
    # Returning the result
    return data_train, geo_train, success
