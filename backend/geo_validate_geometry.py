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

import logging

from shapely.geometry.base import BaseGeometry

from models import RouteNotValidError
from utils import compute_distance_between_2_points


logger = logging.getLogger(__name__)


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

    Raises:
        RouteNotValidError:
            If the route is not valid.

    """
    departure_error_distance = compute_distance_between_2_points(
        departure_coords,
        list(geometry.coords)[0],
    )
    if departure_error_distance > distance_threshold:
        logger.warning("Geometry not valid: departure not valid")
        raise RouteNotValidError("Departure is not valid")

    arrival_error_distance = compute_distance_between_2_points(
        arrival_coords,
        list(geometry.coords)[-1],
    )
    if arrival_error_distance > distance_threshold:
        logger.warning("Geometry not valid: arrival not valid")
        raise RouteNotValidError("Arrival is not valid")
