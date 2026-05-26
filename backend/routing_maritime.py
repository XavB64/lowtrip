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

from functools import lru_cache
from itertools import pairwise

import geopandas as gpd
import momepy
import networkx as nx
import numpy as np
from shapely.geometry import (
    CAP_STYLE,
    LineString,
    Point,
)
from shapely.geometry.base import BaseGeometry
from shapely.ops import nearest_points, unary_union

from parameters import train_intensity


PANAMA_CANAL = LineString([
    (-79.51006995072298, 8.872893100443669),
    (-80.05324567583347, 9.517999845306024),
])

SUEZ_CANAL = LineString([
    (33.91896382986125, 27.263740326941672),
    (32.505571710241114, 29.64748606563672),
    (32.42803964605657, 32.58754502651166),
])

MARITIME_CANALS = [
    PANAMA_CANAL,
    SUEZ_CANAL,
]

# Maritime mesh parameters
MESH_RESOLUTION = 50
"""Number of horizontal and vertical mesh lines."""
SEARCH_MARGIN = 30
"""Geographic margin added around the route area when generating the mesh. In degrees."""
LINE_EXTENSION_FACTOR = 0.001
"""Small geometric extension applied to maritime segments to avoid disconnected routing graph edges."""


@lru_cache(maxsize=1)
def build_coast_geometry() -> tuple[BaseGeometry, list[BaseGeometry]]:
    """Build coastline geometries used for maritime routing.

    The coastline is derived from the land geometry dataset by:
    - buffering land polygons to fix invalid geometries
    - extracting the outer boundary of the resulting geometry
    - splitting the boundary into individual line segments

    These segments are used in the maritime routing graph to connect
    sea mesh structures with coastal entry and exit points.

    The result is cached after the first computation using functools.lru_cache
    to avoid expensive recomputation during routing operations.

    Returns:
        A tuple containing:
            - A Shapely geometry representing the full coastline
            - A list of LineString segments composing the coastline

    """
    coast_lines = unary_union(
        train_intensity.buffer(0, cap_style=CAP_STYLE.square).geometry,
    ).boundary
    coast_segments = list(coast_lines.geoms)

    return coast_lines, coast_segments


def extend_point(
    reference_point: tuple[float, float],
    point_to_extend: tuple[float, float],
):
    """Extend a point along a direction vector.

    The point is extended in the direction formed by (reference_point -> point_to_extend).

    """
    direction_vector_end = (
        point_to_extend[0] - reference_point[0],
        point_to_extend[1] - reference_point[1],
    )
    return (
        point_to_extend[0] + direction_vector_end[0] * LINE_EXTENSION_FACTOR,
        point_to_extend[1] + direction_vector_end[1] * LINE_EXTENSION_FACTOR,
    )


def extend_line(line: LineString, extend_start=False):
    """Extend a line along its direction vector, to avoid disconnected routing graph edges.

    The line end is always extended. The start of the line can also be
    extended optionally.

    Args:
        line: Input line geometry.
        extend_start: Whether to extend the start of the line as well.

    Returns:
        An extended LineString geometry.

    """
    start_point = line.coords[0]
    second_last_point = line.coords[-2]
    last_point = line.coords[-1]

    new_end_point = extend_point(second_last_point, last_point)

    new_start_point = start_point
    if extend_start:
        second_point = line.coords[1]
        # Note: arguments are intentionally inverted to extend the start point
        # in the direction of the first segment (second_point -> start_point).
        new_start_point = extend_point(second_point, start_point)

    return LineString([new_start_point, *line.coords[1:], new_end_point])


def build_maritime_mesh(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    land_geometries=train_intensity,
) -> list[LineString]:
    """Build a maritime navigation mesh between two coordinates.

    A grid of horizontal and vertical line segments is generated around the
    departure and arrival area. Land intersections are then removed so that
    only navigable sea segments remain. The resulting segments are then
    slightly extended to improve graph connectivity between adjacent edges.

    The generated mesh is later used to construct the maritime routing graph.

    Args:
        departure_coords: Departure coordinates as (lon, lat).
        arrival_coords: Arrival coordinates as (lon, lat).
        land_geometries: GeoDataFrame containing world land geometries.

    Returns:
        A list of extended LineString geometries representing the navigable
        maritime mesh used for routing graph construction.

    """
    mesh_segments = []

    # limit to range +/- 20
    lon_min = min(departure_coords[0], arrival_coords[0]) - SEARCH_MARGIN
    lon_max = max(departure_coords[0], arrival_coords[0]) + SEARCH_MARGIN

    lat_min = min(departure_coords[1], arrival_coords[1]) - SEARCH_MARGIN
    lat_max = max(departure_coords[1], arrival_coords[1]) + SEARCH_MARGIN

    for lon in np.linspace(lon_min, lon_max, MESH_RESOLUTION):
        mesh_segments.append(LineString([(lon, lat_min), (lon, lat_max)]))

    for lat in np.linspace(lat_min, lat_max, MESH_RESOLUTION):
        mesh_segments.append(LineString([(lon_min, lat), (lon_max, lat)]))

    # Remove land intersections to keep only navigable sea segments.
    navigable_segments = gpd.overlay(
        gpd.GeoDataFrame(geometry=gpd.GeoSeries(mesh_segments)),
        land_geometries[["geometry"]],
        how="difference",
        keep_geom_type=False,
    ).explode()

    return [
        extend_line(segment, extend_start=True)
        for segment in navigable_segments.geometry
    ]


def build_shore_connection(
    coordinates: tuple[float, float],
    coast: BaseGeometry,
) -> LineString:
    """Build a connection line between a point and the nearest coastline.

    The generated line is slightly extended to ensure proper connectivity
    with the maritime routing network.

    """
    point = Point(coordinates)

    nearest_coast_point = nearest_points(point, coast)[1]

    shore_connection = LineString([point, nearest_coast_point])
    return extend_line(shore_connection)


def build_direct_sea_connection(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    land_geometries: gpd.GeoDataFrame = train_intensity,
) -> BaseGeometry:
    """Build the direct maritime connection between two points.

    The direct line between departure and arrival is clipped against land
    geometries so that only navigable sea segments are kept.

    """
    direct_line = LineString([
        departure_coords,
        arrival_coords,
    ])

    sea_connection = gpd.overlay(
        gpd.GeoDataFrame(geometry=gpd.GeoSeries([direct_line])),
        land_geometries[["geometry"]],
        how="difference",
        keep_geom_type=False,
    )

    return unary_union(sea_connection.geometry)


def build_maritime_network(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
) -> gpd.GeoDataFrame:
    """Build a navigable maritime network between two coordinates.

    The network is composed of:
        - coast lines
        - canal connections
        - sea mesh segments
        - shore-to-sea connection lines
        - direct maritime connection between departure and arrival

    A schematic representation of a generated maritime mesh is available in
    `routing_maritime_mesh.png`.

    Args:
        departure_coords: Departure coordinates as (lon, lat).
        arrival_coords: Arrival coordinates as (lon, lat).

    Returns:
        A GeoDataFrame containing navigable maritime segments.

    """
    coast_geometry, coast_segments = build_coast_geometry()

    # Build maritime mesh
    sea_mesh_segments = build_maritime_mesh(
        departure_coords,
        arrival_coords,
    )

    # Connect departure and arrival points to the nearest coastline.
    shore_connections = [
        build_shore_connection(point, coast_geometry)
        for point in [departure_coords, arrival_coords]
    ]

    # Build direct connection between departure and arrival
    direct_connection = build_direct_sea_connection(
        departure_coords,
        arrival_coords,
    )

    navigation_segments = [
        *coast_segments,
        *sea_mesh_segments,
        *shore_connections,
        *MARITIME_CANALS,
        direct_connection,
    ]
    maritime_network = unary_union(navigation_segments)

    return gpd.GeoDataFrame(geometry=gpd.GeoSeries(maritime_network)).explode(
        index_parts=False,
    )


def compute_maritime_shortest_path(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
):
    """Compute the shortest maritime route between two geographic points.

    This function builds a navigable maritime network between the departure
    and arrival coordinates, converts it into a NetworkX graph, and computes
    the shortest path using edge length weights.

    The resulting route is reconstructed as a single merged geometry by
    combining the geometries of all edges along the shortest path.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).

    Returns:
        A Shapely geometry representing the shortest maritime route.

    """
    maritime_network = build_maritime_network(departure_coords, arrival_coords)

    maritime_graph = momepy.gdf_to_nx(
        maritime_network,
        approach="primal",
        multigraph=False,
    )

    # Compute the shortest path on the maritime graph using edge length as weight.
    # Output: a sequence of nodes (A -> B -> C -> D)
    node_path = nx.shortest_path(
        maritime_graph,
        source=departure_coords,
        target=arrival_coords,
        weight="mm_len",
    )

    # Extract the geometry of each pair of consecutive nodes in the shortest path
    edge_geometries = []
    for u, v in pairwise(node_path):
        edge_data = maritime_graph.get_edge_data(u, v)
        if edge_data and "geometry" in edge_data:
            edge_geometries.append(edge_data["geometry"])

    # Merge the edges into a single continuous Geometry
    return unary_union(edge_geometries)
