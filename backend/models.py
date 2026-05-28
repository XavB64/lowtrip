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

import geopandas as gpd
from pydantic import BaseModel, Field
from shapely.geometry.base import BaseGeometry


######################
# INPUTS
######################

TransportMean = Literal[
    "train",
    "bus",
    "car",
    "hitchHiking",
    "ecar",
    "plane",
    "ferry",
    "sail",
    "bicycle",
]


class TripPoint(BaseModel):
    """Trip point, represented by lon/lat coordinates."""

    lon: float = Field(ge=-180, le=180)
    lat: float = Field(ge=-90, le=90)


class TripStep(TripPoint):
    """Trip step composed of lat/lon coordinates, a transport mean and some optional options."""

    transport_mean: TransportMean = Field(alias="transport-mean")
    passengers_nb: int | None = Field(
        default=None,
        alias="passengers-nb",
    )
    ferry_options: str | None = Field(
        default=None,
        alias="ferry-option",
    )


class Trip(BaseModel):
    """Trip composed of departure and trip steps."""

    departure: TripPoint
    steps: list[TripStep] = Field(min_length=1)


class ApiPayload(BaseModel):
    """Pydantic class for API payload. Validation by Pydantic."""

    main_trip: Trip = Field(alias="main-trip")
    second_trip: Trip | None = Field(
        default=None,
        alias="second-trip",
    )


######################
# INTERNAL
######################


@dataclass(frozen=True)
class CountrySplitConfig:
    """Configuration for the function split_path_by_country (depends on the
    means of transport).
    """

    dataset: gpd.GeoDataFrame
    iso_column: str
    emission_factor_column: str


@dataclass(frozen=True)
class CountryRouteSegment:
    """Segment of route in a specific country."""

    country_name: str
    emission_factor: float
    geometry: BaseGeometry
    path_length_km: float


######################
# OUTPUTS
######################

TripType = Literal["MAIN_TRIP", "SECOND_TRIP", "DIRECT_TRIP"]


@dataclass
class TripStepGeometry:
    """Trip step geometry."""

    coordinates: list[list[float]]
    transport_means: str
    length: float  # in km
    country_label: str | None
    trip_type: TripType


@dataclass
class EmissionPart:
    """Emission dataclass."""

    kg_co2_eq: float  # in kgCO2
    ef_tot: float | None
    distance: float  # in km
    name: str


@dataclass
class BaseStepData:
    """Base step dataclass."""

    transport: TransportMean
    emissions: list[EmissionPart]
    path_length: float  # in km


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
    passengers_nb: int
    coeff_upstream: float
    coeff_fuel: float


@dataclass
class HitchHikingStepData(BaseStepData):
    """Hitch hiking step dataclass."""

    transport: Literal["hitchHiking"]
    coeff_fuel: float
    coeff_hitch_hike: float


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
    | HitchHikingStepData
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
