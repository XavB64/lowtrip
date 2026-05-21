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
MESH_RESOLUTION = 20
"""Number of horizontal and vertical mesh lines."""
SEARCH_MARGIN = 20
"""Geographic margin added around the route area when generating the mesh. In degrees."""


def create_coast(world=train_intensity, buffer=0):
    """World is the dataset from geopandas, already loaded for trains and ecar
    Return a list of geometries as well as the overall multi geometry.
    """
    coast_lines = unary_union(
        world.buffer(buffer, cap_style=CAP_STYLE.square).geometry,
    ).boundary
    # To shapely list
    coast_exp = list(gpd.GeoSeries(coast_lines).explode().values)
    return coast_lines, coast_exp


def extend_line(line, additional_length=0.001, start=False):
    # Define the additional length you want to add to the LineString

    # Get the coordinates of the first and last points of the LineString
    start_point = line.coords[0]
    end_point = line.coords[-1]

    # Calculate the direction vector from the last point to the second-to-last point
    direction_vector_end = (
        end_point[0] - line.coords[-2][0],
        end_point[1] - line.coords[-2][1],
    )

    # Calculate the new end point by extending the last point along the direction vector
    new_end_point = (
        end_point[0] + direction_vector_end[0] * additional_length,
        end_point[1] + direction_vector_end[1] * additional_length,
    )

    if start:
        # Calculate the direction vector from the second point to the first point
        direction_vector_start = (
            line.coords[1][0] - start_point[0],
            line.coords[1][1] - start_point[1],
        )

        # Calculate the new start point by extending the first point along the direction vector
        new_start_point = (
            start_point[0] - direction_vector_start[0] * additional_length,
            start_point[1] - direction_vector_start[1] * additional_length,
        )

        # We extend from the start also
        # Create a new LineString with the extended length
        extended_line = LineString([new_start_point, *line.coords[1:], new_end_point])

    else:
        extended_line = LineString([start_point, *line.coords[1:], new_end_point])

    return extended_line


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

    return [extend_line(segment, start=True) for segment in navigable_segments.geometry]


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

    Args:
        departure_coords: Departure coordinates as (lon, lat).
        arrival_coords: Arrival coordinates as (lon, lat).

    Returns:
        A GeoDataFrame containing navigable maritime segments.

    """
    coast_geometry, coast_segments = create_coast()

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


def get_shortest_path(start, end):
    maritime_network = build_maritime_network(start, end)

    # To graph
    graph = momepy.gdf_to_nx(maritime_network, approach="primal", multigraph=False)

    # Shortest path
    path = nx.shortest_path(graph, source=start, target=end, weight="mm_len")

    # Extract the edge geometries of the shortest path
    shortest_path_edges = [(path[i], path[i + 1]) for i in range(len(path) - 1)]
    shortest_path_geometries = [
        graph.get_edge_data(u, v)["geometry"]
        for u, v in shortest_path_edges
        if "geometry" in graph.get_edge_data(u, v)
    ]

    # Merge the geometries of the edges in the shortest path
    return unary_union(shortest_path_geometries)
