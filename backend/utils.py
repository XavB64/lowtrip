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
from flask import abort
import geopandas as gpd
import numpy as np
import pandas as pd

# Web
from shapely import ops
from shapely.geometry import LineString, MultiLineString
from shapely.geometry.base import BaseGeometry

from models import (
    CountryRouteSegment,
    TripPayload,
    TripStep,
    TripStepGeometry,
    TripType,
)
from parameters import (
    carbon_intensity_electricity,
    GEOD,
    train_intensity,
)


# Not really accurate but good enough and fast for some purposes
def kilometer_to_degree(km):
    c = 180 / (np.pi * 6371)  # Earth radius (km)
    return c * km


def m_to_km(d):
    return d / 1000


def compute_distance_between_2_points(
    point1: tuple[float, float],
    point2: tuple[float, float],
):
    return m_to_km(GEOD.geometry_length(LineString([point1, point2])))


class GeometryRecognitionError(Exception):
    """Exception raised when the geometry is not recognized."""


def split_path_by_country(
    path: LineString,
    method: str,
    real_path_length: float,
    trip_type: TripType,
    sea_threshold=5,
) -> tuple[list[CountryRouteSegment], list[TripStepGeometry]]:
    """Split a route by country and compute country-specific route segments.

    The route geometry is intersected with country boundaries to determine
    the distance traveled in each country. Country-specific emission
    factors are then attached to each segment depending on the transport
    method.

    Unmatched route parts (typically sea crossings, bridges, or tunnels)
    can optionally be reassigned to the nearest country when their length
    exceeds the sea_threshold.

    Args:
        path: Route geometry as a LineString.
        method: Transport method used to select the emission factor dataset
            (e.g. "train" or "ecar").
        real_path_length: Total route length in kilometers used to rescale
            computed geometry lengths.
        trip_type: Type of trip associated with the generated geometries.
        sea_threshold: Minimum unmatched segment length in kilometers before
            reassignment to the nearest country.

    Returns:
        A tuple containing:
            - A list of CountryRouteSegment with country-specific
            emission factors and traveled distances.
            - A list of TripStepGeometry for frontend trip rendering.

    Raises:
        GeometryRecognitionError:
            If a route geometry cannot be converted to trip coordinates.

    """
    gdf = gpd.GeoSeries(
        path,
        crs="epsg:4326",
    )

    if method == "train":
        # Sources:
        # - European countries: ADEME Base Carbone (2024)
        # - China, Japan, USA, India & Russia: Railway Handbook produced by the International
        #   and Environmental Agency and the Union of Railways (2017, https://uic.org/IMG/pdf/handbook_iea-uic_2017_web3.pdf)
        # - other countries: 100gCO2 /p.km by default
        data = train_intensity
        iso = "ISO2"
        EF = "EF_tot"
    else:  # ecar
        # Source: Our World in Data (2024) - https://ourworldindata.org/electricity-mix
        data = carbon_intensity_electricity
        iso = "Code"
        EF = "mix"

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
            pd
            .concat([res.explode(), test.explode()])
            .groupby(iso)
            .agg(
                NAME=("NAME", lambda x: x.iloc[0]),
                EF=(EF, lambda x: x.iloc[0]),
                geometry=(
                    "geometry",
                    lambda x: ops.linemerge(MultiLineString(x.values)),
                ),
            )
        )

    else:
        u = (
            res
            .explode()
            .groupby(iso)
            .agg(
                NAME=("NAME", lambda x: x.iloc[0]),
                EF=(EF, lambda x: x.iloc[0]),
                geometry=(
                    "geometry",
                    lambda x: ops.linemerge(MultiLineString(x.values)),
                ),
            )
        )

    gdf = gpd.GeoDataFrame(u, geometry="geometry", crs="epsg:4326").reset_index()

    raw_segments = [
        CountryRouteSegment(
            country_name=row["NAME"],
            emission_factor=row["EF"] / 1000,  # conversion in kg
            geometry=row["geometry"],
            path_length_km=m_to_km(GEOD.geometry_length(row["geometry"])),
        )
        for _, row in gdf.iterrows()
    ]

    total_length = sum(segment.path_length_km for segment in raw_segments)
    scale_factor = real_path_length / total_length

    segments = []
    geometries = []

    for segment in raw_segments:
        # rescale segment_length with real_path_length
        segment_length = segment.path_length_km * scale_factor

        # compute country route segment
        segments.append(
            CountryRouteSegment(
                country_name=segment.country_name,
                emission_factor=segment.emission_factor,
                geometry=segment.geometry,
                path_length_km=segment_length,
            ),
        )

        # compute trip step geometry
        if isinstance(segment.geometry, LineString):
            coordinates = [
                [list(coord) for coord in segment.geometry.coords],
            ]

        elif isinstance(segment.geometry, MultiLineString):
            coordinates = [
                [list(coord) for coord in line.coords]
                for line in segment.geometry.geoms
            ]

        else:
            raise GeometryRecognitionError

        geometries.append(
            TripStepGeometry(
                coordinates=coordinates,
                transport_means="Railway",
                length=segment_length,
                country_label=segment.country_name,
                trip_type=trip_type,
            ),
        )

    return segments, geometries


def validate_geometry(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    geometry: BaseGeometry | None,
    distance_threshold=100,
):
    """Validate that the route geometry matches the requested coordinates by checking
    that the departure and arrival of geometries are close enough to the ones requested.

    Args:
        departure_coords: Requested departure coordinates.
        arrival_coords: Requested arrival coordinates.
        geometry: Route geometry to validate.
        distance_threshold: Maximum allowed distance in kilometers.

    Returns:
        ``True`` if the geometry is valid, otherwise ``False``.

    """
    departure_error_distance = compute_distance_between_2_points(
        departure_coords,
        list(geometry.coords)[0],
    )
    if departure_error_distance > distance_threshold:
        print("Departure is not valid")
        return False

    arrival_error_distance = compute_distance_between_2_points(
        arrival_coords,
        list(geometry.coords)[-1],
    )
    if arrival_error_distance > distance_threshold:
        print("Arrival is not valid")
        return False

    return True


def extract_path_steps_from_payload(trip_payload: TripPayload) -> list[TripStep]:
    result = []
    for i in range(len(trip_payload["lon"])):
        result.append(
            TripStep(
                lon=trip_payload["lon"][i],
                lat=trip_payload["lat"][i],
                transport_means=trip_payload["transp"][i],
                passengers_nb=trip_payload["nb"][i],
                options=trip_payload["options"][i],
            ),
        )

    if len(result) < 2:
        abort(400, "Trip should have at least 1 step")

    return result
