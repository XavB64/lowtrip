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

from models import (
    EmissionPart,
    FerryStepData,
    SailStepData,
    TripStepGeometry,
    TripStepResult,
    TripType,
)
from parameters import GEOD
from routing_maritime import compute_maritime_shortest_path
from utils import get_coordinates_from_base_geometry, m_to_km


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


def compute_ferry_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
    options="none",
    precomputed_route_length_km: float | None = None,
) -> TripStepResult:
    """Compute a ferry trip between two geographic coordinates.

    The maritime route geometry is computed using a custom routing algorithm:
    - a navigable maritime mesh is generated around the departure and arrival
      area
    - land intersections are removed to keep only sea segments
    - a graph is built from the resulting maritime network
    - Dijkstra shortest-path algorithm is applied to compute the optimal route

    A schematic representation of a generated maritime mesh is available in
    `routing_maritime_mesh.png`.

    Ferry emissions are then estimated from the resulting maritime distance
    and the selected ferry travel options.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).
        trip_type: Type of trip associated with the route geometry.
        options: Ferry travel options affecting the emission factor.
            Supported values:
                - "none"
                - "cabin"
                - "vehicle"
                - "cabinVehicle"
        precomputed_route_length_km: Optional precomputed route length in
            kilometers used to avoid recomputing the sea itinerary.

    Returns:
        A TripStepResult containing:
            - ferry emissions
            - route distance
            - computed maritime route geometry

    """
    if precomputed_route_length_km:
        path_length = precomputed_route_length_km
        geometries = []
    else:
        path_geometry = compute_maritime_shortest_path(departure_coords, arrival_coords)

        path_length = m_to_km(GEOD.geometry_length(path_geometry))
        coordinates = get_coordinates_from_base_geometry(path_geometry)
        geometries = [
            TripStepGeometry(
                coordinates=coordinates,
                transport_means="sail",
                length=path_length,
                country_label=None,
                trip_type=trip_type,
            ),
        ]

    # Determine EF depending on the chosen options
    EF = EF_FERRY_SEAT + EF_FERRY_BASE
    if options == "cabin":
        EF = EF_FERRY_CABIN + EF_FERRY_BASE
    elif options == "vehicle":
        EF = EF_FERRY_CAR + EF_FERRY_SEAT + EF_FERRY_BASE
    elif options == "cabinVehicle":
        EF = EF_FERRY_CAR + EF_FERRY_CABIN + EF_FERRY_BASE

    return TripStepResult(
        step_data=FerryStepData(
            transport="ferry",
            emissions=[
                EmissionPart(
                    name="usage",
                    kg_co2_eq=round(EF * path_length, 2),
                    ef_tot=EF,
                    distance=round(path_length),
                ),
            ],
            path_length=round(path_length),
            coeff_total=EF,
            options=options,
        ),
        geometries=geometries,
    )


def compute_sail_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
    precomputed_route_length_km: float | None = None,
) -> TripStepResult:
    """Compute a sail trip between two geographic coordinates.

    The maritime route geometry is computed using a custom routing algorithm:
    - a navigable maritime mesh is generated around the departure and arrival
      area
    - land intersections are removed to keep only sea segments
    - a graph is built from the resulting maritime network
    - Dijkstra shortest-path algorithm is applied to compute the optimal route

    A schematic representation of a generated maritime mesh is available in
    `routing_maritime_mesh.png`.

    Emissions are then estimated from the resulting maritime distance.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).
        trip_type: Type of trip associated with the route geometry.
        precomputed_route_length_km: Optional precomputed route length in
            kilometers used to avoid recomputing the sea itinerary.

    Returns:
        A TripStepResult containing:
            - sail emissions
            - route distance
            - computed maritime route geometry

    """
    if precomputed_route_length_km:
        path_length = precomputed_route_length_km
        geometries = []
    else:
        path_geometry = compute_maritime_shortest_path(departure_coords, arrival_coords)

        path_length = m_to_km(GEOD.geometry_length(path_geometry))
        coordinates = get_coordinates_from_base_geometry(path_geometry)
        geometries = [
            TripStepGeometry(
                coordinates=coordinates,
                transport_means="sail",
                length=path_length,
                country_label=None,
                trip_type=trip_type,
            ),
        ]

    return TripStepResult(
        step_data=SailStepData(
            transport="sail",
            emissions=[
                EmissionPart(
                    name="Usage",
                    kg_co2_eq=round(EF_SAIL * path_length, 2),
                    ef_tot=EF_SAIL,
                    distance=round(path_length),
                ),
            ],
            path_length=round(path_length),
            coeff_total=EF_SAIL,
        ),
        geometries=geometries,
    )
