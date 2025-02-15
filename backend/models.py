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


@dataclass
class TripStepGeometry:
    """Trip step geometry."""

    coordinates: list[list[float]]
    transport_means: str
    length: float
    color: str
    country_label: str | None
