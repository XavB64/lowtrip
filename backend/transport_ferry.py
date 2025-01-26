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
from dataclasses import dataclass

import geopandas as gpd
import momepy
import networkx as nx
import numpy as np
import pandas as pd
from pyproj import Geod
from shapely.geometry import (
    CAP_STYLE,
    LineString,
    Point,
)
from shapely.ops import nearest_points, unary_union

from parameters import (
    EF_ferry,
    EF_sail,
    train_intensity,
)


@dataclass
class Emission:
    """Class for an emission object."""

    kg_co2_eq: float
    ef_tot: float
    color: str


@dataclass
class FerryStepResults:
    """Class for the results of a ferry step."""

    geometry: pd.DataFrame
    emissions: Emission
    path_length: float
    options: str


@dataclass
class SailStepResults:
    """Class for the results of a sail step."""

    geometry: pd.DataFrame
    emissions: Emission
    path_length: float


def ferry_emissions_to_pd_objects(
    ferry_step: FerryStepResults,
) -> (pd.DataFrame, pd.DataFrame):
    ferry_data = pd.DataFrame({
        "kgCO2eq": [ferry_step.emissions.kg_co2_eq],
        "EF_tot": [ferry_step.emissions.ef_tot],
        "path_length": [ferry_step.path_length],
        "colors": [ferry_step.emissions.color],
        "NAME": [ferry_step.options],
        "Mean of Transport": ["Ferry"],
    })

    geometry_data = ferry_step.geometry

    return ferry_data, geometry_data


def sail_emissions_to_pd_objects(
    sail_step: SailStepResults,
) -> (pd.DataFrame, pd.DataFrame):
    sail_data = pd.DataFrame({
        "kgCO2eq": [sail_step.emissions.kg_co2_eq],
        "EF_tot": [sail_step.emissions.ef_tot],
        "path_length": [sail_step.path_length],
        "colors": [sail_step.emissions.color],
        "NAME": ["Usage"],
        "Mean of Transport": ["Sail"],
    })
    return sail_data, sail_step.geometry


def get_shortest_path(line_gdf, start, end):
    # s = time.time()
    # To graph
    graph = momepy.gdf_to_nx(line_gdf, approach="primal", multigraph=False)
    # print(graph.nodes)
    # Shortest path
    path = nx.shortest_path(graph, source=start, target=end, weight="mm_len")
    # Extract the edge geometries of the shortest path
    shortest_path_edges = [(path[i], path[i + 1]) for i in range(len(path) - 1)]
    shortest_path_geometries = [
        graph.get_edge_data(u, v)["geometry"]
        for u, v in shortest_path_edges
        if "geometry" in graph.get_edge_data(u, v)
    ]

    # print('network : ', round(time.time() - s, 3))
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
    # Get linestring to get to the see
    nearest_point_on_line = nearest_points(Point(point), coast)[1]

    # Create a new linestring connecting the two points
    new_linestring = LineString([Point(point), nearest_point_on_line])
    # print(list(new_linestring.coords))

    return new_linestring  # noqa: RET504


def extend_line(line, additional_length=0.001, start=False):  # , start=True
    # Define the additional length you want to add to the LineString
    # additional_length = 0.2
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
    # Possibility to optimize the mesh ?
    # s = time.time()
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
    )  # .explore(), crs='epsg:4326')

    # Need to extend lines ? seems not
    # sea['geometry'] = sea['geometry'].apply(lambda x : extend_line(x, additional_length=0.001))
    # print('Get sea lines : ', round(time.time() - s, 3))
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
    # s = time.time()
    sea_lines = list(get_sea_lines(start, end).geometry.values)
    full_edge = unary_union(
        coast_exp0
        + canal
        + [extend_line(get_line_coast(p, coast_lines0)) for p in [start, end]]
        +
        # Extend the lines for the shortest path to the sea
        [extend_line(k, start=True) for k in sea_lines[:-1]]
        +
        # Don't extend direct conection
        [sea_lines[-1]],
    )  # get the lines where ferry can navigate
    # print('Extend line : ', round(time.time() - s, 3))
    return gpd.GeoDataFrame(
        geometry=gpd.GeoSeries(full_edge),
    ).explode()  # , crs='epsg:4326'


def ferry_to_gdf(
    tag1,
    tag2,
    EF=EF_ferry,
    options="None",
    color_usage="#ffffff",
) -> FerryStepResults:
    """Parameters
        - tag1, tag2
        - EF : emission factor in gCO2/pkm for ferry
        - color : color for path and bar chart
    return:
        - full dataframe for ferry.

    """
    # Compute geometry
    # Convert the inputs in float
    start = tuple([float(x) for x in tag1])
    end = tuple([float(x) for x in tag2])
    # Here new function
    geom = get_shortest_path(gdf_lines(start, end), start, end)
    # geom = LineString([tag1, tag2])
    # Compute the true distance
    geod = Geod(ellps="WGS84")
    bird = geod.geometry_length(geom) / 1e3
    # Compute the good emission factor
    if options == "None":
        EF = EF["Seat"] + EF["Base"]
    elif options == "Cabin":
        EF = EF["Cabin"] + EF["Base"]
    elif options == "Vehicle":
        EF = EF["Car"] + EF["Seat"] + EF["Base"]
    elif options == "CabinVehicle":
        EF = EF["Car"] + EF["Cabin"] + EF["Base"]

    geo_ferry = pd.DataFrame(
        pd.Series({
            "colors": color_usage,
            "label": "Ferry",
            "length": str(int(bird)) + "km",
            "geometry": geom,
        }),
    ).transpose()

    return FerryStepResults(
        geometry=geo_ferry,
        emissions=Emission(
            kg_co2_eq=EF * bird,
            ef_tot=EF,
            color=color_usage,
        ),
        path_length=bird,
        options=options,
    )


def sail_to_gdf(tag1, tag2, EF=EF_sail, color_usage="#ffffff") -> SailStepResults:
    """Parameters
        - tag1, tag2
        - EF : emission factor in gCO2/pkm for ferry
        - color : color for path and bar chart
    return:
        - full dataframe for ferry.

    """
    # Compute geometry
    # Convert the inputs in float
    start = tuple([float(x) for x in tag1])
    end = tuple([float(x) for x in tag2])
    # Here new function
    geom = get_shortest_path(gdf_lines(start, end), start, end)
    # geom = LineString([tag1, tag2])
    # Compute the true distance
    geod = Geod(ellps="WGS84")
    bird = geod.geometry_length(geom) / 1e3
    # Compute geodataframe and dataframe
    geo_ferry = pd.DataFrame(
        pd.Series({
            "colors": color_usage,
            "label": "Sail",
            "length": str(int(bird)) + "km",
            "geometry": geom,
        }),
    ).transpose()

    return SailStepResults(
        geometry=geo_ferry,
        emissions=Emission(
            kg_co2_eq=EF * bird,
            ef_tot=EF,
            color=color_usage,
        ),
        path_length=bird,
    )
