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
from http import HTTPStatus

import requests
from shapely.geometry import LineString

from models import (
    BusStepData,
    CarStepData,
    CountrySplitConfig,
    EcarStepData,
    EmissionPart,
    TripStepGeometry,
    TripStepResult,
    TripType,
)
from parameters import carbon_intensity_electricity
from utils import (
    m_to_km,
    split_path_by_country,
    validate_geometry,
)


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
):
    """Find a road route between two coordinates.

    Uses the routing provider to compute a route geometry and its total distance.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).

    Returns:
        A tuple containing:
            - The route geometry as a LineString.
            - The route distance in kilometers.
            - Whether the route was successfully computed.

    """
    response = requests.get(
        f"{OSM_ROUTER_URL}/{departure_coords[0]},{departure_coords[1]};{arrival_coords[0]},{arrival_coords[1]}?overview=simplified&geometries=geojson",
    )

    if response.status_code != HTTPStatus.OK:
        route_geometry, route_length, success = None, None, False
        return route_geometry, route_length, success

    route = response.json()["routes"][0]
    route_geometry = LineString(route["geometry"]["coordinates"])

    if not validate_geometry(
        departure_coords,
        arrival_coords,
        route_geometry,
    ):
        return None, None, False

    route_length = m_to_km(route["distance"])
    success = True
    return route_geometry, route_length, success


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
        A ``TripStepResult`` containing the route geometry and emissions
        data, or ``None`` if no valid route could be found.

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success:
        return None

    # We need to filter by country and add length / Emission factors
    country_route_segments, geometries = split_path_by_country(
        route_geometry,
        route_length,
        ECAR_COUNTRY_SPLIT_CONFIG,
        trip_type=trip_type,
    )

    passengers_nb = int(passengers_nb)
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


def get_car_emissions(
    route_length: float,
    passengers_nb: str,
) -> list[EmissionPart]:
    if passengers_nb == "👍":  # Hitch-hiking
        EF_fuel = EF_CAR_FUEL * EXTRA_PASSENGER_EMISSION_FACTOR
        EF_construction = 0
    else:
        passengers_nb = int(passengers_nb)
        passenger_adjustment_factor = compute_passenger_adjustment_factor(passengers_nb)
        EF_fuel = EF_CAR_FUEL * passenger_adjustment_factor
        EF_construction = EF_CAR_CONSTRUCTION / passengers_nb

    return [
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


def get_bus_emissions(
    route_length: float,
) -> list[EmissionPart]:
    return [
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


@dataclass
class CarBusResults:
    """Dataclass for car and bus emissions and road geometry."""

    geometries: list[TripStepGeometry]
    bus_step_data: BusStepData
    car_step_data: CarStepData


def compute_car_and_bus_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
) -> CarBusResults | None:
    """Compute both car and bus trips for the same road route.

    This function is used as an optimization to avoid computing the same
    road geometry multiple times when comparing transport modes. The route
    is fetched once and reused to calculate both car and bus emissions.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).

    Returns:
        A ``CarBusResults`` object containing the shared route geometry and
        the computed emissions for both transport modes, or ``None`` if no
        valid route could be found.

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success:
        return None

    road_geometry = TripStepGeometry(
        coordinates=[[list(coord) for coord in route_geometry.coords]],
        transport_means="Road",
        length=route_length,
        country_label=None,
        trip_type="DIRECT_TRIP",
    )

    car_emissions = get_car_emissions(
        route_length,
        1,
    )

    bus_emissions = get_bus_emissions(
        route_length,
    )

    return CarBusResults(
        geometries=[road_geometry],
        bus_step_data=BusStepData(
            transport="bus",
            emissions=bus_emissions,
            path_length=round(route_length),
            coeff_upstream=EF_BUS_CONSTRUCTION,
            coeff_fuel=EF_BUS_FUEL,
        ),
        car_step_data=CarStepData(
            transport="car",
            emissions=car_emissions,
            path_length=round(route_length),
            passengers_nb=1,
            is_hitch_hike=False,
            coeff_upstream=EF_CAR_CONSTRUCTION,
            coeff_fuel=EF_CAR_FUEL,
        ),
    )


def compute_bus_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
) -> TripStepResult | None:
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

    Returns:
        A ``TripStepResult`` containing the route geometry and emissions
        data, or ``None`` if no valid route could be found.

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success:
        return None

    road_geometry = TripStepGeometry(
        coordinates=[[list(coord) for coord in route_geometry.coords]],
        transport_means="Road",
        length=route_length,
        country_label=None,
        trip_type=trip_type,
    )
    emissions = get_bus_emissions(
        route_length,
    )

    return TripStepResult(
        step_data=BusStepData(
            transport="bus",
            emissions=emissions,
            path_length=round(route_length),
            coeff_upstream=EF_BUS_CONSTRUCTION,
            coeff_fuel=EF_BUS_FUEL,
        ),
        geometries=[road_geometry],
    )


def compute_car_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
    passengers_nb=1,
) -> TripStepResult | None:
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

    Returns:
        A ``TripStepResult`` containing the route geometry and emissions
        data, or ``None`` if no valid route could be found.

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success:
        return None

    geometry = TripStepGeometry(
        coordinates=[[list(coord) for coord in route_geometry.coords]],
        transport_means="Road",
        length=route_length,
        country_label=None,
        trip_type=trip_type,
    )

    return TripStepResult(
        step_data=CarStepData(
            transport="car",
            emissions=get_car_emissions(
                route_length,
                passengers_nb,
            ),
            is_hitch_hike=passengers_nb == "👍",
            passengers_nb=passengers_nb,
            path_length=round(route_length),
            coeff_upstream=EF_CAR_CONSTRUCTION,
            coeff_fuel=EF_CAR_FUEL,
        ),
        geometries=[geometry],
    )
