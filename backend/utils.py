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

###################
###### Utils ######
###################
import geopandas as gpd
import numpy as np
import pandas as pd
from pyproj import Geod

# Web
from shapely import ops
from shapely.geometry import LineString, MultiLineString

from parameters import (
    carbon_intensity_electricity,
    sea_threshold as default_sea_threshold,
    train_intensity,
)


# Not really accurate but good enough and fast for some purposes
def kilometer_to_degree(km):
    c = 180 / (np.pi * 6371)  # Earth radius (km)
    return c * km


def split_path_by_country(
    path: LineString,
    method: str,
    real_path_length: float,
    sea_threshold=default_sea_threshold,
):
    """Split the path by country and compute the length of each of its parts.

    Parameters
    ----------
        - path : path geometry in LineString
        - mode : train / ecar
        - th : threshold to remove unmatched gaps between countries that are too small (km)
    return:
        - geodataframe of path parts by countries

    """
    gdf = gpd.GeoSeries(
        path,
        crs="epsg:4326",
    )

    if method == "train":
        iso = "ISO2"
        EF = "EF_tot"
        data = train_intensity
    else:  # ecar
        iso = "Code"
        EF = "mix"
        data = carbon_intensity_electricity

    # Split by geometry
    gdf.name = "geometry"
    res = gpd.overlay(
        gpd.GeoDataFrame(gdf, geometry="geometry", crs="epsg:4326"),
        data,
        how="intersection",
    )
    diff = gpd.overlay(
        gpd.GeoDataFrame(gdf, geometry="geometry", crs="epsg:4326"),
        data,
        how="difference",
    )

    # Check if the unmatched data is significant
    if diff.length.sum() > kilometer_to_degree(sea_threshold):
        print("Sea detected")
        # In case we have bridges / tunnels across sea:
        # Distinction depending on linestring / multilinestring
        if diff.geometry[0].geom_type == "MultiLineString":
            diff_2 = gpd.GeoDataFrame(list(diff.geometry.values[0].geoms))
        else:
            diff_2 = gpd.GeoDataFrame(list(diff.geometry.values))

        diff_2.columns = ["geometry"]
        diff_2 = diff_2.set_geometry("geometry", crs="epsg:4326")

        # Filter depending is the gap is long enough to be taken into account and join with nearest country
        test = diff_2[diff_2.length > kilometer_to_degree(sea_threshold)].sjoin_nearest(
            data,
            how="left",
        )

        # Aggregation per country and combining geometries
        u = (
            pd.concat([res.explode(), test.explode()])
            .groupby(iso)
            .agg(
                NAME=("NAME", lambda x: x.iloc[0]),
                EF_tot=(EF, lambda x: x.iloc[0]),
                geometry=(
                    "geometry",
                    lambda x: ops.linemerge(MultiLineString(x.values)),
                ),
            )
        )

    else:
        u = (
            res.explode()
            .groupby(iso)
            .agg(
                NAME=("NAME", lambda x: x.iloc[0]),
                EF_tot=(EF, lambda x: x.iloc[0]),
                geometry=(
                    "geometry",
                    lambda x: ops.linemerge(MultiLineString(x.values)),
                ),
            )
        )

    gdf = gpd.GeoDataFrame(u, geometry="geometry", crs="epsg:4326").reset_index()

    # Compute the length of each part of the path
    l_length = []
    geod = Geod(ellps="WGS84")
    for geom in gdf.geometry.values:
        l_length.append(geod.geometry_length(geom) / 1e3)
    gdf["path_length"] = l_length

    # Rescale the length with train_dist (especially when simplified = True)
    gdf["path_length"] *= real_path_length / gdf["path_length"].sum()

    return gdf.drop("ISO2", axis=1)


def validate_geom(tag1, tag2, geom, th):
    """Verify that the departure and arrival of geometries are close enough to the ones requested
    parameters:
        - tag1, tag2 : requested coordinates
        - geom : shapely geometry answered
        - th : threshold (km) for which we reject the geometry
    return:
        boolean (True valid geometry / False wrong geometry).
    """
    geod = Geod(ellps="WGS84")
    # To compute distances
    # Creating geometries for departure
    ecart = LineString([tag1, list(geom.coords)[0]])
    # Maybe geod can compute length between 2 points directly
    if geod.geometry_length(ecart) / 1e3 > th:
        print("Departure is not valid")
        return False
    # Arrival
    ecart = LineString([tag2, list(geom.coords)[-1]])
    # Maybe geod can compute length between 2 points directly
    if geod.geometry_length(ecart) / 1e3 > th:
        print("Arrival is not valid")
        return False
    # If we arrive here both dep and arr were validated
    return True
