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
) -> TripStepResult:
    """Parameters
        - departure_coords, arrival_coords
        - EF : emission factor in gCO2/pkm for ferry
    return:
        - full dataframe for ferry.

    """
    # Compute geometry
    path_geometry = compute_maritime_shortest_path(departure_coords, arrival_coords)
    path_length = m_to_km(GEOD.geometry_length(path_geometry))
    coordinates = get_coordinates_from_base_geometry(path_geometry)

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
        geometries=[
            TripStepGeometry(
                coordinates=coordinates,
                transport_means="ferry",
                length=path_length,
                country_label=None,
                trip_type=trip_type,
            ),
        ],
    )


def compute_sail_trip(
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
    path_geometry = compute_maritime_shortest_path(departure_coords, arrival_coords)
    path_length = m_to_km(GEOD.geometry_length(path_geometry))
    coordinates = get_coordinates_from_base_geometry(path_geometry)

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
        geometries=[
            TripStepGeometry(
                coordinates=coordinates,
                transport_means="sail",
                length=path_length,
                country_label=None,
                trip_type=trip_type,
            ),
        ],
    )
