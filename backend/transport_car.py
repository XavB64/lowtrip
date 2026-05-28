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

from http import HTTPStatus

import requests
from shapely.geometry import LineString

from geo_split_path_by_country import split_path_by_country
from geo_validate_geometry import validate_geometry
from models import (
    BusStepData,
    CarStepData,
    CountrySplitConfig,
    EcarStepData,
    EmissionPart,
    HitchHikingStepData,
    RouteNotFoundError,
    RouteResult,
    TripStepGeometry,
    TripStepResult,
    TripType,
)
from parameters import carbon_intensity_electricity
from utils import m_to_km


OSM_ROUTER_URL = "http://router.project-osrm.org/route/v1/driving"


# Car emissions factors (kgCO2e / km).
# Source: ADEME Base Carbone (2024)
EF_CAR_CONSTRUCTION = 0.0256
EF_CAR_FUEL = 0.192

# Bus emissions factors (kgCO2e / passenger.km).
# Source: ADEME Base Carbone (2024)
EF_BUS_CONSTRUCTION = 0.00442
EF_BUS_FUEL = 0.025

# Electric car emissions factors (kgCO2e / km).
EF_ECAR_CONSTRUCTION = 0.0836
# Source: EV Database (2024) - https://ev-database.org/cheatsheet/energy-consumption-electric-car
EF_ECAR_FUEL = 0.187

ECAR_COUNTRY_SPLIT_CONFIG = CountrySplitConfig(
    dataset=carbon_intensity_electricity,
    iso_column="Code",
    emission_factor_column="mix",
)

# Additional vehicle emissions generated per extra passenger.
# Used to adjust transport emissions based on occupancy.
EXTRA_PASSENGER_EMISSION_FACTOR = 0.04


def find_route(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
) -> RouteResult:
    """Find a road route between two coordinates.

    Uses the routing provider to compute a route geometry and its total distance.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).

    Returns:
        A RouteResult containing the route geometry and path length.

    Raises:
        RouteNotFoundError:
            If no route could be found.

    """
    response = requests.get(
        f"{OSM_ROUTER_URL}/{departure_coords[0]},{departure_coords[1]};{arrival_coords[0]},{arrival_coords[1]}?overview=simplified&geometries=geojson",
    )

    if response.status_code != HTTPStatus.OK:
        raise RouteNotFoundError(
            f"No route by road found between {departure_coords} and {arrival_coords}",
        )

    route = response.json()["routes"][0]
    route_geometry = LineString(route["geometry"]["coordinates"])

    validate_geometry(departure_coords, arrival_coords, route_geometry)

    route_length = m_to_km(route["distance"])
    return RouteResult(geometry=route_geometry, path_length_km=route_length)


def compute_passenger_adjustment_factor(
    passengers_nb: int,
) -> float:
    """Compute the emission adjustment factor based on passenger count.

    Each additional passenger increases total vehicle emissions by 4% while
    sharing emissions across all passengers.

    """
    return (1 + EXTRA_PASSENGER_EMISSION_FACTOR * (passengers_nb - 1)) / passengers_nb


def compute_ecar_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
    passengers_nb=1,
):
    """Compute an electric car trip between two coordinates.

    Finds a road route, validates its geometry, and computes the associated
    transport emissions.

    Emissions are computed for 1 passenger only, as:
    -  the sum of:
        - vehicle construction emissions
        - fuel/electricity consumption emissions, which depends on the country.
    - divided by the number of passengers.

    The route is split by country to apply country-specific electricity
    emission factors based on the distance traveled in each country.

    Fuel/Electricity emissions are adjusted according to the number of passengers
    by adding 4% additional emissions per extra passenger.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).
        trip_type: Type of trip to compute.
        passengers_nb: Number of passengers in the vehicle.

    Returns:
        A ``TripStepResult`` containing the route geometry and emissions data.

    """
    result = find_route(departure_coords, arrival_coords)

    route_length = result.path_length_km

    # We need to filter by country and add length / Emission factors
    country_route_segments, geometries = split_path_by_country(
        result.geometry,
        route_length,
        ECAR_COUNTRY_SPLIT_CONFIG,
        trip_type=trip_type,
    )

    passenger_adjustment_factor = compute_passenger_adjustment_factor(passengers_nb)

    emissions = [
        EmissionPart(
            name=segment.country_name,
            kg_co2_eq=round(
                segment.emission_factor
                * EF_ECAR_FUEL
                * passenger_adjustment_factor
                * segment.path_length_km,
                2,
            ),
            ef_tot=segment.emission_factor,
            distance=round(segment.path_length_km),
        )
        for segment in country_route_segments
    ]
    emissions.append(
        EmissionPart(
            name="construction",
            kg_co2_eq=round(route_length * EF_ECAR_CONSTRUCTION / passengers_nb),
            ef_tot=EF_ECAR_CONSTRUCTION,
            distance=round(route_length),
        ),
    )

    return TripStepResult(
        step_data=EcarStepData(
            transport="ecar",
            emissions=emissions,
            path_length=round(route_length),
            passengers_nb=passengers_nb,
            coeff_upstream=EF_ECAR_CONSTRUCTION,
            coeff_fuel=EF_ECAR_FUEL,
        ),
        geometries=geometries,
    )


def compute_bus_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
    precomputed_route_length_km: float | None = None,
) -> TripStepResult:
    """Compute a bus trip between two coordinates.

    Finds a road route, validates its geometry, and computes the
    associated transport emissions.

    Bus emissions are computed as the sum of:
    - vehicle construction emissions,
    - fuel consumption emissions.

    Road infrastructure emissions are not included in the calculation.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).
        trip_type: Type of trip to compute.
        precomputed_route_length_km: Optional precomputed route length in
            kilometers used to avoid recomputing the road itinerary.

    Returns:
        A ``TripStepResult`` containing the route geometry and emissions data.

    """
    if precomputed_route_length_km:
        route_length = precomputed_route_length_km
        geometries = []
    else:
        result = find_route(departure_coords, arrival_coords)

        route_length = result.path_length_km
        geometries = [
            TripStepGeometry(
                coordinates=[[list(coord) for coord in result.geometry.coords]],
                transport_means="Road",
                length=route_length,
                country_label=None,
                trip_type=trip_type,
            ),
        ]

    emissions = [
        EmissionPart(
            name="construction",
            kg_co2_eq=round(route_length * EF_BUS_CONSTRUCTION, 2),
            ef_tot=EF_BUS_CONSTRUCTION,
            distance=round(route_length),
        ),
        EmissionPart(
            name="fuel",
            kg_co2_eq=round(route_length * EF_BUS_FUEL, 2),
            ef_tot=EF_BUS_FUEL,
            distance=round(route_length),
        ),
    ]

    return TripStepResult(
        step_data=BusStepData(
            transport="bus",
            emissions=emissions,
            path_length=round(route_length),
            coeff_upstream=EF_BUS_CONSTRUCTION,
            coeff_fuel=EF_BUS_FUEL,
        ),
        geometries=geometries,
    )


def compute_car_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
    passengers_nb=1,
    precomputed_route_length_km: float | None = None,
) -> TripStepResult:
    """Compute a car trip between two coordinates.

    Finds a road route, validates its geometry, and computes the
    associated transport emissions and trip metadata.

    Car emissions are computed for 1 passenger only, as:
    -  the sum of:
        - vehicle construction emissions
        - fuel consumption emissions
    - divided by the number of passengers.

    Fuel consumption emissions are adjusted according to the number of passengers
    by adding 4% additional emissions per extra passenger.

    Road infrastructure emissions are not included in the calculation.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).
        trip_type: Type of trip to compute.
        passengers_nb: Number of passengers in the vehicle.
        precomputed_route_length_km: Optional precomputed route length in
            kilometers used to avoid recomputing the road itinerary.

    Returns:
        A ``TripStepResult`` containing the route geometry and emissions data.
    """
    if precomputed_route_length_km is not None:
        route_length = precomputed_route_length_km
        geometries = []
    else:
        result = find_route(departure_coords, arrival_coords)

        route_length = result.path_length_km
        geometries = [
            TripStepGeometry(
                coordinates=[[list(coord) for coord in result.geometry.coords]],
                transport_means="Road",
                length=route_length,
                country_label=None,
                trip_type=trip_type,
            ),
        ]

    passenger_adjustment_factor = compute_passenger_adjustment_factor(passengers_nb)
    EF_fuel = EF_CAR_FUEL * passenger_adjustment_factor
    EF_construction = EF_CAR_CONSTRUCTION / passengers_nb

    emissions = [
        EmissionPart(
            name="construction",
            kg_co2_eq=round(route_length * EF_construction, 2),
            ef_tot=EF_CAR_CONSTRUCTION,
            distance=round(route_length),
        ),
        EmissionPart(
            name="fuel",
            kg_co2_eq=round(route_length * EF_fuel, 2),
            ef_tot=EF_CAR_FUEL,
            distance=round(route_length),
        ),
    ]

    return TripStepResult(
        step_data=CarStepData(
            transport="car",
            emissions=emissions,
            passengers_nb=passengers_nb,
            path_length=round(route_length),
            coeff_upstream=EF_CAR_CONSTRUCTION,
            coeff_fuel=EF_CAR_FUEL,
        ),
        geometries=geometries,
    )


def compute_hitch_hiking_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
) -> TripStepResult:
    """Compute a hitchhiking trip between two coordinates.

    Finds a road route, validates its geometry, and computes the
    associated transport emissions and trip metadata.

    For hitchhiking, only the emissions attributable to the additional
    passenger are considered. Vehicle construction emissions are excluded,
    as the trip is assumed to occur regardless of the hitchhiking
    passenger.

    Fuel emissions are computed as 4% of standard car fuel emissions.

    Road infrastructure emissions are not included in the calculation.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).
        trip_type: Type of trip to compute.

    Returns:
        A ``TripStepResult`` containing the route geometry and emissions data.

    """
    result = find_route(departure_coords, arrival_coords)

    route_length = result.path_length_km

    geometries = [
        TripStepGeometry(
            coordinates=[[list(coord) for coord in result.geometry.coords]],
            transport_means="Road",
            length=route_length,
            country_label=None,
            trip_type=trip_type,
        ),
    ]

    EF_fuel = EF_CAR_FUEL * EXTRA_PASSENGER_EMISSION_FACTOR

    return TripStepResult(
        step_data=HitchHikingStepData(
            transport="hitchHiking",
            emissions=[
                EmissionPart(
                    name="fuel",
                    kg_co2_eq=round(route_length * EF_fuel, 2),
                    ef_tot=EF_fuel,
                    distance=round(route_length),
                ),
            ],
            path_length=round(route_length),
            coeff_hitch_hike=EXTRA_PASSENGER_EMISSION_FACTOR,
            coeff_fuel=EF_CAR_FUEL,
        ),
        geometries=geometries,
    )
