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

from typing import Literal

from models import (
    ApiPayload,
    StepData,
    Trip,
    TripResult,
    TripStepGeometry,
)
from parameters import PLANE_MIN_DISTANCE
from transport_bicycle import compute_bicycle_trip
from transport_car import (
    compute_bus_trip,
    compute_car_trip,
    compute_ecar_trip,
    compute_hitch_hiking_trip,
)
from transport_ferry import compute_ferry_trip, compute_sail_trip
from transport_plane import compute_plane_trip
from transport_train import compute_train_trip
from utils import compute_distance_between_2_points


def compute_emissions(payload: ApiPayload):
    """Compute emissions and geometries for the requested trips.

    The main trip is always computed.

    If a second trip is provided, emissions are also computed for this
    alternative trip.

    If the main trip contains a single transport step and no second trip is
    provided, additional direct trips are computed for alternative transport
    modes (train, bus, car, plane, etc.).

    Args:
        payload: Validated API payload containing the trip definitions.

    Returns:
        A dictionary containing:
            - trips: Computed trip results.
            - geometries: Route geometries for map rendering.

    """
    main_trip, geometries = compute_custom_trip_emissions(
        "MAIN_TRIP",
        payload.main_trip,
    )

    trips = [main_trip]

    if payload.second_trip:
        second_trip_result, second_trip_geometries = compute_custom_trip_emissions(
            "SECOND_TRIP",
            payload.second_trip,
        )
        trips.append(second_trip_result)
        geometries.extend(second_trip_geometries)

    elif len(payload.main_trip.steps) == 1:
        direct_trips, direct_trips_geometries = compute_direct_trips_emissions(
            payload.main_trip,
            main_trip.steps[0].path_length,
        )
        trips.extend(direct_trips)
        geometries.extend(direct_trips_geometries)

    return {
        "trips": trips,
        "geometries": geometries,
    }


def compute_custom_trip_emissions(
    trip_name: Literal["MAIN_TRIP", "SECOND_TRIP"],
    trip: Trip,
) -> tuple[TripResult, list[TripStepGeometry]]:
    """Compute emissions and geometries for a custom trip.

    The function computes emissions step by step and aggregates both
    emissions data and route geometries.

    Args:
        trip_name: Trip identifier ("MAIN_TRIP" or "SECOND_TRIP").
        trip: Trip definition containing the departure point and trip steps.

    Returns:
        A tuple containing:
            - The computed trip result.
            - The geometries associated with each computed route segment.

    Raises:
        ValueError:
            If a route cannot be computed for one of the trip steps.

    """
    emissions_data: list[StepData] = []
    geometries: list[TripStepGeometry] = []

    departure_coordinates = (trip.departure.lon, trip.departure.lat)

    for idx, arrival in enumerate(trip.steps):
        arrival_coordinates = (arrival.lon, arrival.lat)
        transport_mean = arrival.transport_mean

        error_message = f"step n°{idx + 1} failed with {transport_mean}, please change mean of transport or locations."

        if transport_mean == "train":
            try:
                results = compute_train_trip(
                    departure_coordinates,
                    arrival_coordinates,
                    trip_name,
                )
            except Exception as err:
                raise ValueError(error_message) from err

        elif transport_mean == "bus":
            try:
                results = compute_bus_trip(
                    departure_coordinates,
                    arrival_coordinates,
                    trip_name,
                )
            except Exception as err:
                raise ValueError(error_message) from err

        elif transport_mean == "car":
            try:
                results = compute_car_trip(
                    departure_coordinates,
                    arrival_coordinates,
                    trip_name,
                    passengers_nb=arrival.passengers_nb,
                )
            except Exception as err:
                raise ValueError(error_message) from err

        elif transport_mean == "hitchHiking":
            try:
                results = compute_hitch_hiking_trip(
                    departure_coordinates,
                    arrival_coordinates,
                    trip_name,
                )
            except Exception as err:
                raise ValueError(error_message) from err

        elif transport_mean == "ecar":
            try:
                results = compute_ecar_trip(
                    departure_coordinates,
                    arrival_coordinates,
                    trip_name,
                    passengers_nb=arrival.passengers_nb,
                )
            except Exception as err:
                raise ValueError(error_message) from err

        elif transport_mean == "bicycle":
            results = compute_bicycle_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_name,
            )

        elif transport_mean == "plane":
            results = compute_plane_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_name,
            )

        elif transport_mean == "ferry":
            results = compute_ferry_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_name,
                options=arrival.ferry_options,
            )

        elif transport_mean == "sail":
            results = compute_sail_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_name,
            )

        else:
            print(f"Transport mean {transport_mean} not handled")
            raise ValueError(error_message)

        emissions_data.append(results.step_data)
        geometries.extend(results.geometries)
        departure_coordinates = arrival_coordinates

    return TripResult(name=trip_name, steps=emissions_data), geometries


def compute_direct_trips_emissions(
    requested_trip: Trip,
    main_trip_path_length: float,
) -> tuple[list[TripResult], list[TripStepGeometry]]:
    """Compute alternative direct trips for a simple trip.

    Given a trip containing a single transport step, this function computes
    emissions for alternative transport modes between the same departure and
    arrival points.

    - Plane alternatives are only computed for trips whose bird-flight distance
    exceeds 300 km.
    - Train and road alternatives (bus and car) are only computed for trips
    using a land transport mode.
    - Sea alternatives (sail and ferry) are only computed for trips
    using a sea transport mode.

    Road-based transport modes may reuse an already computed route length to
    avoid redundant routing computations.

    Args:
        requested_trip: Trip containing exactly one transport step.
        main_trip_path_length: Path length of the original trip, used when
            reusing an already computed road route.

    Returns:
        A tuple containing:
            - Alternative trip results.
            - Associated route geometries.

    """
    departure_coordinates = (requested_trip.departure.lon, requested_trip.departure.lat)
    arrival = requested_trip.steps[0]
    arrival_coordinates = (arrival.lon, arrival.lat)
    transport_mean = arrival.transport_mean

    trips: list[TripResult] = []
    geometries: list[TripStepGeometry] = []

    # Compute plane emissions only for trips longer than 300km
    if transport_mean != "plane":
        bird_distance = compute_distance_between_2_points(
            departure_coordinates,
            arrival_coordinates,
        )
        if bird_distance > PLANE_MIN_DISTANCE:
            plane_result = compute_plane_trip(
                departure_coordinates,
                arrival_coordinates,
                "DIRECT_TRIP",
            )
            trips.append(TripResult(name="PLANE", steps=[plane_result.step_data]))
            geometries.extend(plane_result.geometries)

    # Compute direct alternatives for sea transport modes.
    if transport_mean in {"ferry", "sail"}:
        if transport_mean != "ferry":
            ferry_results = compute_ferry_trip(
                departure_coordinates,
                arrival_coordinates,
                "DIRECT_TRIP",
                precomputed_route_length_km=main_trip_path_length,
            )
            if ferry_results is not None:
                trips.append(TripResult(name="FERRY", steps=[ferry_results.step_data]))

        else:
            sail_results = compute_sail_trip(
                departure_coordinates,
                arrival_coordinates,
                "DIRECT_TRIP",
                precomputed_route_length_km=main_trip_path_length,
            )
            if sail_results is not None:
                trips.append(TripResult(name="SAIL", steps=[sail_results.step_data]))

        return trips, geometries

    # Compute direct alternatives for land transport modes.
    if transport_mean != "train":
        try:
            train_results = compute_train_trip(
                departure_coordinates,
                arrival_coordinates,
                "DIRECT_TRIP",
            )
            if train_results is not None:
                trips.append(TripResult(name="TRAIN", steps=[train_results.step_data]))
                geometries.extend(train_results.geometries)
        except Exception as e:
            print(e)

    # Reuse the already computed road route length when possible
    # to avoid recomputing the same road itinerary multiple times.
    road_path_length = (
        main_trip_path_length
        if transport_mean in {"bus", "car", "ecar", "hitchHiking"}
        else None
    )

    if transport_mean != "bus":
        try:
            bus_results = compute_bus_trip(
                departure_coordinates,
                arrival_coordinates,
                "DIRECT_TRIP",
                precomputed_route_length_km=road_path_length,
            )
            trips.append(TripResult(name="BUS", steps=[bus_results.step_data]))

            if road_path_length is None and bus_results.geometries:
                geometries.extend(bus_results.geometries)
                road_path_length = bus_results.geometries[0].length

        except Exception as e:
            print(e)

    if road_path_length and transport_mean != "car":
        car_results = compute_car_trip(
            departure_coordinates,
            arrival_coordinates,
            "DIRECT_TRIP",
            precomputed_route_length_km=road_path_length,
        )
        trips.append(TripResult(name="CAR", steps=[car_results.step_data]))

    return trips, geometries
