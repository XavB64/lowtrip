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
    StepData,
    Trip,
    TripResult,
    TripStepGeometry,
    TripType,
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


def compute_custom_trip_emissions(
    name: str,
    trip: Trip,
) -> tuple[TripResult, list[TripStepGeometry]]:
    """Parameters
    ----------
        - name, name of the trip (MAIN_TRIP or SECONDARY_TRIP)
        - trip_inputs, inputs of the trip

    Returns
    -------
        - full dataframe for emissions
        - geometries for path

    Raises
    ------
    ValueError
        If no path is found with the given transport means.

    """
    emissions_data: list[StepData] = []
    geometries: list[TripStepGeometry] = []
    trip_type: TripType = "MAIN_TRIP" if name == "MAIN_TRIP" else "SECOND_TRIP"

    departure_coordinates = (trip.departure.lon, trip.departure.lat)

    for idx in range(len(trip.steps)):
        arrival = trip.steps[idx]
        arrival_coordinates = (arrival.lon, arrival.lat)

        transport_mean = arrival.transport_mean
        results = None

        # Compute depending on the mean of transport
        if transport_mean == "train":
            results = compute_train_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_type,
            )

        elif transport_mean == "bus":
            results = compute_bus_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_type,
            )

        elif transport_mean == "car":
            results = compute_car_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_type,
                passengers_nb=arrival.passengers_nb,
            )

        elif transport_mean == "hitchHiking":
            results = compute_hitch_hiking_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_type,
            )

        elif transport_mean == "ecar":
            results = compute_ecar_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_type,
                passengers_nb=arrival.passengers_nb,
            )

        elif transport_mean == "bicycle":
            results = compute_bicycle_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_type,
            )

        elif transport_mean == "plane":
            results = compute_plane_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_type,
            )

        elif transport_mean == "ferry":
            results = compute_ferry_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_type,
                options=arrival.ferry_options,
            )

        elif transport_mean == "sail":
            results = compute_sail_trip(
                departure_coordinates,
                arrival_coordinates,
                trip_type,
            )

        if results is None:  # Step is not successful
            error_message = f"step n°{int(idx) + 1} failed with {transport_mean}, please change mean of transport or locations."
            raise ValueError(error_message)

        emissions_data.append(results.step_data)
        geometries += results.geometries
        departure_coordinates = arrival_coordinates

    return TripResult(name=name, steps=emissions_data), geometries


def compute_direct_trips_emissions(
    inputs: Trip,
    main_trip_path_length: float,
):
    """Compute emissions for the same trip, but with other transport means given the initial transport means used,
    the departure and arrival coordinates.

    Parameters
    ----------
        - inputs: list of exactly 2 trip steps

    Returns
    -------
    list[...]
        - trips: list of emissions for each mean of transport
        - geometries: geometries of the trips

    """
    departure_coordinates = (inputs.departure.lon, inputs.departure.lat)
    arrival = inputs.steps[0]
    arrival_coordinates = (arrival.lon, arrival.lat)
    transport_mean = arrival.transport_mean

    trips: list[TripResult] = []
    geometries: list[TripStepGeometry] = []

    # Compute train and road emissions except if the initial transport means is Ferry or Sail
    if transport_mean not in {"ferry", "sail"}:
        if transport_mean != "train":
            train_results = compute_train_trip(
                departure_coordinates,
                arrival_coordinates,
                "DIRECT_TRIP",
            )
            if train_results is not None:
                trips.append(TripResult(name="TRAIN", steps=[train_results.step_data]))
                geometries += train_results.geometries

        road_path_length = (
            main_trip_path_length if transport_mean in {"bus", "car", "ecar"} else None
        )

        if transport_mean != "bus":
            bus_results = compute_bus_trip(
                departure_coordinates,
                arrival_coordinates,
                "DIRECT_TRIP",
                precomputed_route_length_km=road_path_length,
            )
            trips.append(TripResult(name="BUS", steps=[bus_results.step_data]))
            if road_path_length is None and len(bus_results.geometries) > 0:
                geometries += bus_results.geometries
                road_path_length = bus_results.geometries[0].length

        if transport_mean != "car":
            car_results = compute_car_trip(
                departure_coordinates,
                arrival_coordinates,
                "DIRECT_TRIP",
                precomputed_route_length_km=road_path_length,
            )
            trips.append(TripResult(name="CAR", steps=[car_results.step_data]))

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
            geometries += plane_result.geometries

    # Sea modes - to do later : similar behavior than bus / car --> Custom function to get the route only once

    return trips, geometries
