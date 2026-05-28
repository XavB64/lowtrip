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

import geopandas as gpd
import pandas as pd
from shapely import ops
from shapely.geometry import LineString, MultiLineString

from models import (
    CountryRouteSegment,
    CountrySplitConfig,
    TripStepGeometry,
    TripType,
)
from parameters import GEOD
from utils import (
    get_coordinates_from_base_geometry,
    kilometer_to_degree,
    m_to_km,
)


def split_path_by_country(
    path: LineString,
    real_path_length: float,
    country_split_config: CountrySplitConfig,
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
        real_path_length: Total route length in kilometers used to rescale
            computed geometry lengths.
        country_split_config: Configuration depending on the means of transport.
        trip_type: Type of trip associated with the generated geometries.
        sea_threshold: Minimum unmatched segment length in kilometers before
            reassignment to the nearest country.

    Returns:
        A tuple containing:
            - A list of CountryRouteSegment with country-specific
            emission factors and traveled distances.
            - A list of TripStepGeometry for frontend trip rendering.

    """
    gdf = gpd.GeoSeries(
        path,
        crs="epsg:4326",
    )

    # Split by geometry
    gdf.name = "geometry"
    intersections = gpd.overlay(
        gpd.GeoDataFrame(gdf, geometry="geometry", crs="epsg:4326"),
        country_split_config.dataset,
        how="intersection",
    )
    unmatched_segments = gpd.overlay(
        gpd.GeoDataFrame(gdf, geometry="geometry", crs="epsg:4326"),
        country_split_config.dataset,
        how="difference",
    )

    # Check if the unmatched data is significant
    if unmatched_segments.length.sum() < kilometer_to_degree(sea_threshold):
        segments_to_aggregate = intersections.explode()

    else:
        # In case we have bridges / tunnels across sea:
        if unmatched_segments.geometry.iloc[0].geom_type == "MultiLineString":
            sea_segments = gpd.GeoDataFrame(
                list(unmatched_segments.geometry.iloc[0].geoms),
            )
        else:
            sea_segments = gpd.GeoDataFrame(list(unmatched_segments.geometry.values))

        sea_segments.columns = ["geometry"]
        sea_segments = sea_segments.set_geometry("geometry", crs="epsg:4326")

        # Filter depending is the gap is long enough to be taken into account and join with nearest country
        nearest_country_segments = sea_segments[
            sea_segments.length > kilometer_to_degree(sea_threshold)
        ].sjoin_nearest(
            country_split_config.dataset,
            how="left",
        )

        segments_to_aggregate = pd.concat([
            intersections.explode(),
            nearest_country_segments.explode(),
        ])

    # Aggregation per country and combining geometries
    aggregated_segments = segments_to_aggregate.groupby(
        country_split_config.iso_column,
    ).agg(
        NAME=("NAME", "first"),
        EF=(country_split_config.emission_factor_column, "first"),
        geometry=(
            "geometry",
            lambda x: ops.linemerge(MultiLineString(x.values)),
        ),
    )

    raw_segments = [
        CountryRouteSegment(
            country_name=row["NAME"],
            emission_factor=row["EF"] / 1000,  # conversion in kg
            geometry=row["geometry"],
            path_length_km=m_to_km(GEOD.geometry_length(row["geometry"])),
        )
        for _, row in aggregated_segments.iterrows()
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
        coordinates = get_coordinates_from_base_geometry(
            segment.geometry,
        )
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
