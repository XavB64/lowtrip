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

import numpy as np
from shapely.geometry import LineString, MultiLineString
from shapely.geometry.base import BaseGeometry

from parameters import GEOD


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


def get_coordinates_from_base_geometry(geometry: BaseGeometry):
    """Convert a Shapely geometry into nested coordinate lists.

    Raises:
        GeometryRecognitionError:
            If a route geometry cannot be converted to trip coordinates.

    """
    if isinstance(geometry, LineString):
        return [[list(coord) for coord in geometry.coords]]
    if isinstance(geometry, MultiLineString):
        return [[list(coord) for coord in line.coords] for line in geometry.geoms]
    raise GeometryRecognitionError
