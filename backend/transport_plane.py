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

from shapely.geometry import LineString

from models import (
    EmissionPart,
    PlaneStepData,
    TripStepGeometry,
    TripStepResult,
    TripType,
)
from parameters import GEOD
from utils import m_to_km


@dataclass(frozen=True)
class PlaneEmissionFactors:
    """Dataclass for plane emission factors. Values depend on the length of the flight."""

    construction: float
    upstream: float
    combustion: float
    infra: float


# Plane emissions factors (kgCO2e / passenger.km)
# SHORT < 1000km < MEDIUM < 3500km < LONG
# Source: ADEME Base Carbone (2024)
EF_PLANE_SHORT = PlaneEmissionFactors(
    construction=0.00038,
    upstream=0.0242,
    combustion=0.117,
    infra=0.0003,
)
EF_PLANE_MEDIUM = PlaneEmissionFactors(
    construction=0.00036,
    upstream=0.0176,
    combustion=0.0848,
    infra=0.0003,
)
EF_PLANE_LONG = PlaneEmissionFactors(
    construction=0.00026,
    upstream=0.0143,
    combustion=0.0687,
    infra=0.0003,
)

# Source: https://www.sciencedirect.com/science/article/pii/S0966692318305544
DETOUR_COEFF = 1.076

# Additional CO2 emissions (kg) due to holding patterns
# Source: ATMOSFAIR
# https://www.atmosfair.de/wp-content/uploads/flight-emissionscalculator-documentation-calculationmethodology.pdf
HOLD = 3.81  # kg/p

# Coefficient to apply to take into account non-CO2 effects
# Sources: ADEME and IPCC
CONTRAILS_COEFF = 2


# Number of points in plane geometry
GREAT_CIRCLE_INTERPOLATION_POINTS = 100


def compute_great_circle_route(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
):
    """Compute the great-circle route between two geographic coordinates.

    A great-circle route represents the shortest path between two points on
    the Earth's surface. The route is computed using geodesic interpolation
    with pyproj, generating intermediate points along the geodesic.

    The resulting points are assembled into a LineString geometry suitable
    for map display and route visualization.

    Special handling is applied for routes crossing the antimeridian
    (±180° longitude) to avoid invalid map rendering caused by longitude
    wrapping.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).

    Returns:
        A tuple containing:
            - A LineString representing the great-circle route
            - The geodesic distance in kilometers

    """
    # Generate intermediate longitude/latitude points along the geodesic route
    # between departure and arrival coordinates.
    geodesic_result = GEOD.inv_intermediate(
        lon1=float(departure_coords[0]),
        lat1=float(departure_coords[1]),
        lon2=float(arrival_coords[0]),
        lat2=float(arrival_coords[1]),
        npts=GREAT_CIRCLE_INTERPOLATION_POINTS,
        initial_idx=0,
        terminus_idx=0,
    )

    min_lon = min(geodesic_result.lons)
    max_lon = max(geodesic_result.lons)

    if max_lon - min_lon < 180:
        coordinates = [
            [lon, lat] for lon, lat in zip(geodesic_result.lons, geodesic_result.lats)
        ]
    else:
        # Handle routes crossing the antimeridian (±180° longitude).
        # Negative longitudes are shifted to the [0, 360] range to avoid
        # incorrect long lines across the map during visualization.
        coordinates = [
            [lon + 360 if lon < 0 else lon, lat]
            for lon, lat in zip(geodesic_result.lons, geodesic_result.lats)
        ]

    return LineString(coordinates), m_to_km(geodesic_result.dist)


def get_plane_emission_factors(route_length: float):
    if route_length < 1000:
        return EF_PLANE_SHORT
    if route_length < 3500:
        return EF_PLANE_MEDIUM
    return EF_PLANE_LONG


def compute_plane_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
) -> TripStepResult:
    """Compute a plane trip between two geographic coordinates.

    The flight geometry is generated as a great-circle route using geodesic
    interpolation with pyproj. Flight emissions are estimated from the route
    distance using ADEME Base Carbone emission factors.

    Different emission factors are applied depending on flight distance:
    - short-haul (< 1000 km)
    - medium-haul (< 3500 km)
    - long-haul (>= 3500 km)

    Additional effects are also included:
    - detour coefficient to approximate real flight paths
    - holding pattern emissions
    - non-CO2 effects from contrails

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).
        trip_type: Type of trip associated with the route geometry.

    Returns:
        A TripStepResult containing:
            - plane emissions
            - flight distance
            - great-circle route geometry

    """
    plane_geometry, route_length = compute_great_circle_route(
        departure_coords,
        arrival_coords,
    )

    emissions_factors = get_plane_emission_factors(route_length)
    co2_ef = emissions_factors.combustion + emissions_factors.upstream
    non_co2_ef = emissions_factors.combustion * CONTRAILS_COEFF

    # Apply a detour coefficient to approximate real flight paths.
    route_length_with_detour = route_length * DETOUR_COEFF

    step_data = PlaneStepData(
        transport="plane",
        emissions=[
            EmissionPart(
                name="kerosene",
                kg_co2_eq=round(route_length_with_detour * co2_ef + HOLD, 2),
                ef_tot=co2_ef,
                distance=round(route_length_with_detour),
            ),
            EmissionPart(
                name="contrails",
                kg_co2_eq=round(route_length_with_detour * non_co2_ef, 2),
                ef_tot=non_co2_ef,
                distance=round(route_length_with_detour),
            ),
        ],
        path_length=round(route_length),
        coeff_path_detour=DETOUR_COEFF,
        coeff_contrails=CONTRAILS_COEFF,
        coeff_fuel=emissions_factors.combustion,
        coeff_upstream=emissions_factors.upstream,
        holding=HOLD,
    )

    return TripStepResult(
        step_data=step_data,
        geometries=[
            TripStepGeometry(
                coordinates=[[list(coord) for coord in plane_geometry.coords]],
                transport_means="Flight",
                length=route_length,
                country_label=None,
                trip_type=trip_type,
            ),
        ],
    )
