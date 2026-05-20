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
from shapely.ops import nearest_points, unary_union

from models import (
    EmissionPart,
    FerryStepData,
    SailStepData,
    TripStepGeometry,
    TripStepResult,
    TripType,
)
from parameters import (
    GEOD,
    train_intensity,
)


# Ferry emissions factors (kgCO2e / passenger.km).
# Source: Future.eco, analysis by Maël Thomas-Quillévéré
# https://futur.eco/documentation/transport/ferry/empreinte-par-km-volume

EF_FERRY_CABIN = 0.11
EF_FERRY_SEAT = 0.008
EF_FERRY_BASE = 0.08
EF_FERRY_CAR = 0.114

# Sailboat emissions factor (kgCO2e / passenger.km).
# Source: Sailcoop
EF_SAIL = 0.069


def get_shortest_path(line_gdf, start, end):
    # To graph
    graph = momepy.gdf_to_nx(line_gdf, approach="primal", multigraph=False)

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


def get_line_coast(point, coast):
    """Coast the full shapely geometry."""
    # Get linestring to get to the sea
    nearest_point_on_line = nearest_points(Point(point), coast)[1]

    # Create a new linestring connecting the two points
    new_linestring = LineString([Point(point), nearest_point_on_line])

    return new_linestring  # noqa: RET504


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


def get_sea_lines(start, end, world=train_intensity, nb=20, exp=10):
    # We use train because it's already loaded
    # Create a mesh
    quadri = []
    for lon in np.linspace(
        min(start[0], end[0]) - exp,
        max(start[0], end[0]) + exp,
        nb,
    ):  # limit to range longitude - latidue +/- 20
        quadri.append(
            LineString([
                (lon, min(start[1], end[1]) - exp - 10),
                (lon, max(start[1], end[1]) + exp + 10),
            ]),
        )
    for lat in np.linspace(
        min(start[1], end[1]) - exp,
        max(start[1], end[1]) + exp,
        nb,
    ):
        quadri.append(
            LineString([
                (min(start[0], end[0]) - exp - 10, lat),
                (max(start[0], end[0]) + exp + 10, lat),
            ]),
        )
    # Add also the direct path
    quadri.append(LineString([start, end]))
    # Cut the geometries where there is sea
    sea = gpd.overlay(
        gpd.GeoDataFrame(geometry=gpd.GeoSeries(quadri)),
        world[["geometry"]],
        how="difference",
        keep_geom_type=False,
    )

    return sea.explode()


def gdf_lines(start, end, add_canal=True):
    # Get coast lines
    coast_lines0, coast_exp0 = create_coast(buffer=0)
    canal = []
    if add_canal:
        # Panama
        canal.append(
            LineString([
                (-79.51006995072298, 8.872893100443669),
                (-80.05324567583347, 9.517999845306024),
            ]),
        )
        # Suez
        canal.append(
            LineString([
                (33.91896382986125, 27.263740326941672),
                (32.505571710241114, 29.64748606563672),
                (32.42803964605657, 32.58754502651166),
            ]),
        )

    # Combine
    sea_lines = list(get_sea_lines(start, end).geometry.values)
    full_edge = unary_union(
        coast_exp0
        + canal
        + [extend_line(get_line_coast(p, coast_lines0)) for p in [start, end]]
        +
        # Extend the lines for the shortest path to the sea
        [extend_line(k, start=True) for k in sea_lines[:-1]]
        +
        # Don't extend direct connection
        [sea_lines[-1]],
    )  # get the lines where ferry can navigate

    return gpd.GeoDataFrame(
        geometry=gpd.GeoSeries(full_edge),
    ).explode()


def ferry_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
    options="none",
) -> TripStepResult:
    """Parameters
        - departure_coords, arrival_coords
        - EF : emission factor in gCO2/pkm for ferry
    return:
        - full dataframe for ferry.

    """
    # Compute geometry
    start = tuple([float(x) for x in departure_coords])
    end = tuple([float(x) for x in arrival_coords])
    geom = get_shortest_path(gdf_lines(start, end), start, end)

    # Compute the true distance
    bird = GEOD.geometry_length(geom) / 1e3

    # Compute the good emission factor
    if options == "none":
        EF = EF_FERRY_SEAT + EF_FERRY_BASE
    elif options == "cabin":
        EF = EF_FERRY_CABIN + EF_FERRY_BASE
    elif options == "vehicle":
        EF = EF_FERRY_CAR + EF_FERRY_SEAT + EF_FERRY_BASE
    elif options == "cabinVehicle":
        EF = EF_FERRY_CAR + EF_FERRY_CABIN + EF_FERRY_BASE

    coordinates = []
    for l in geom.geoms:
        t = []
        for coord in l.coords:
            t.append(list(coord))
        coordinates.append(t)

    return TripStepResult(
        step_data=FerryStepData(
            transport="ferry",
            emissions=[
                EmissionPart(
                    name="usage",
                    kg_co2_eq=round(EF * bird, 2),
                    ef_tot=EF,
                    distance=round(bird),
                ),
            ],
            path_length=round(bird),
            coeff_total=EF,
            options=options,
        ),
        geometries=[
            TripStepGeometry(
                coordinates=coordinates,
                transport_means="ferry",
                length=bird,
                country_label=None,
                trip_type=trip_type,
            ),
        ],
    )


def sail_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
) -> TripStepResult:
    """Parameters
        - departure_coords, arrival_coords
        - EF : emission factor in gCO2/pkm for ferry
    return:
        - full dataframe for ferry.

    """
    # Compute geometry
    start = tuple([float(x) for x in departure_coords])
    end = tuple([float(x) for x in arrival_coords])

    geom = get_shortest_path(gdf_lines(start, end), start, end)

    # Compute the true distance
    bird = GEOD.geometry_length(geom) / 1e3

    coordinates = []
    for l in geom.geoms:
        t = []
        for coord in l.coords:
            t.append(list(coord))
        coordinates.append(t)

    return TripStepResult(
        step_data=SailStepData(
            transport="sail",
            emissions=[
                EmissionPart(
                    name="Usage",
                    kg_co2_eq=round(EF_SAIL * bird, 2),
                    ef_tot=EF_SAIL,
                    distance=round(bird),
                ),
            ],
            path_length=round(bird),
            coeff_total=EF_SAIL,
        ),
        geometries=[
            TripStepGeometry(
                coordinates=coordinates,
                transport_means="sail",
                length=bird,
                country_label=None,
                trip_type=trip_type,
            ),
        ],
    )
