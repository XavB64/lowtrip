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

from dataclasses import dataclass
from typing import Literal


######################
# INPUTS
######################


@dataclass
class TripPayload:
    """Trip payload. Can be converted into dataframe."""

    lon: list[float]
    lat: list[float]
    transp: list[str]
    nb: list[str]
    options: list[str]


@dataclass
class TripStep:
    """Trip step."""

    lon: float
    lat: float
    transport_means: str
    passengers_nb: str | None
    options: str | None


######################
# OUTPUTS
######################


@dataclass
class TripStepGeometry:
    """Trip step geometry."""

    coordinates: list[list[float]]
    transport_means: str
    length: float
    color: str
    country_label: str | None


@dataclass
class EmissionPart:
    """Emission dataclass."""

    kg_co2_eq: float
    ef_tot: float | None
    name: str
    color: str


@dataclass
class BaseStepData:
    """Base step dataclass."""

    transport: str
    emissions: list[EmissionPart]
    path_length: float


@dataclass
class BicycleStepData(BaseStepData):
    """Bicycle step dataclass."""

    transport: Literal["bicycle"]
    coeff_upstream: float


@dataclass
class BusStepData(BaseStepData):
    """Bus step dataclass."""

    transport: Literal["bus"]
    coeff_upstream: float
    coeff_fuel: float


@dataclass
class CarStepData(BaseStepData):
    """Car step dataclass."""

    transport: Literal["car"]
    is_hitch_hike: bool
    passengers_nb: int
    coeff_upstream: float
    coeff_fuel: float


@dataclass
class EcarStepData(BaseStepData):
    """ECar step dataclass."""

    transport: Literal["ecar"]
    passengers_nb: int
    coeff_upstream: float
    coeff_fuel: float


@dataclass
class FerryStepData(BaseStepData):
    """Ferry step dataclass."""

    transport: Literal["ferry"]
    coeff_total: float
    options: str


@dataclass
class PlaneStepData(BaseStepData):
    """Plane step dataclass."""

    transport: Literal["plane"]
    coeff_path_detour: float
    coeff_contrails: float
    coeff_fuel: float
    coeff_upstream: float
    holding: float


@dataclass
class TrainStepData(BaseStepData):
    """Train step dataclass."""

    transport: Literal["train"]
    coeff_upstream: float


@dataclass
class SailStepData(BaseStepData):
    """Sail step dataclass."""

    transport: Literal["sail"]
    coeff_total: float


StepData = (
    BicycleStepData
    | BusStepData
    | CarStepData
    | EcarStepData
    | FerryStepData
    | PlaneStepData
    | SailStepData
    | TrainStepData
)


@dataclass
class TripStepResult:
    """Results of the trip step (emissions + geometries)."""

    step_data: StepData
    geometries: list[TripStepGeometry]


@dataclass
class TripResult:
    """Results of the computation for a full trip."""

    name: str  # MAIN_TRIP | SECOND_TRIP | DIRECT_TRIP_{PLANE/BOAT/CAR/...}
    steps: list[StepData]
