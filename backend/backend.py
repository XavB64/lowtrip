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

#####################
### Librairies ######
#####################

# Classic
from pyproj import Geod

# Geometry
from shapely.geometry import LineString

from models import (
    StepData,
    TripResult,
    TripStep,
    TripStepGeometry,
)
from parameters import (
    colors_custom,
    colors_direct,
    min_plane_dist,
)
from transport_bicycle import bicycle_to_gdf
from transport_car import (
    bus_to_gdf,
    car_bus_to_gdf,
    car_to_gdf,
    ecar_to_gdf,
)
from transport_ferry import ferry_to_gdf, sail_to_gdf
from transport_plane import plane_to_gdf
from transport_train import train_to_gdf


######################
#### Functions #######
######################


def compute_custom_trip_emissions(
    name: str,
    trip_inputs: list[TripStep],
    cmap=colors_custom,
):
    """Parameters
    ----------
        - name, name of the trip (MAIN_TRIP or SECONDARY_TRIP)
        - trip_inputs, inputs of the trip

    Return:
    ------
        - full dataframe for emissions
        - geometries for path

    Raises:
    ------
        ValueError: Si l'étape échoue avec le moyen de transport donné.

    """
    emissions_data: list[StepData] = []
    geometries: list[TripStepGeometry] = []

    for idx in range(len(trip_inputs) - 1):  # We loop until last departure
        # Departure coordinates
        depature = trip_inputs[idx]
        departure_coordinates = (depature.lon, depature.lat)

        # Arrival coordinates
        arrival = trip_inputs[idx + 1]
        arrival_coordinates = (arrival.lon, arrival.lat)

        # Mean of transport
        transport_means = arrival.transport_means
        results = None

        # Compute depending on the mean of transport
        if transport_means == "Train":
            results = train_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Train"],
                color_infra=cmap["Cons_infra"],
            )

        elif transport_means == "Bus":
            results = bus_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Road"],
                color_cons=cmap["Cons_infra"],
            )

        elif transport_means == "Car":
            results = car_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                passengers_nb=arrival.passengers_nb,
                color_usage=cmap["Road"],
                color_cons=cmap["Cons_infra"],
            )

        elif transport_means == "eCar":
            results = ecar_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                passengers_nb=arrival.passengers_nb,
                color_usage=cmap["Road"],
                color_cons=cmap["Cons_infra"],
            )

        elif transport_means == "Bicycle":
            results = bicycle_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color=cmap["Bicycle"],
            )

        elif transport_means == "Plane":
            results = plane_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Plane"],
                color_contrails=cmap["Contrails"],
            )

        elif transport_means == "Ferry":
            results = ferry_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Ferry"],
                options=arrival.options,
            )

        elif transport_means == "Sail":
            results = sail_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Ferry"],
            )

        if results is None:  # Step is not successful
            error_message = f"step n°{int(idx) + 1} failed with {transport_means}, please change mean of transport or locations."
            raise ValueError(error_message)

        emissions_data.append(results.step_data)
        geometries += results.geometries

    return TripResult(name=name, steps=emissions_data), geometries


def compute_direct_trips_emissions(inputs: list[TripStep], cmap=colors_direct):
    """Compute emissions for the same trip, but with other transport means given the initial transport means used,
    the departure and arrival coordinates.

    Parameters
    ----------
        - inputs: list of exactly 2 trip steps

    Return
    ------
        - trips: list of emissions for each mean of transport
        - geometries: geometries of the trips

    """
    departure = inputs[0]
    arrival = inputs[1]

    departure_coordinates = (departure.lon, departure.lat)
    arrival_coordinates = (arrival.lon, arrival.lat)
    transport_means = arrival.transport_means

    # Check if we should compute it or not
    train, plane, car, bus = True, True, True, True
    # Sea modes - to do later : similar behavior than bus / car --> Custom function to get the route only once

    # Check distance for plane
    geod = Geod(ellps="WGS84")
    if (
        geod.geometry_length(LineString([departure_coordinates, arrival_coordinates]))
        / 1e3
        < min_plane_dist
    ):
        # Then we do not suggest the plane solution
        plane = False

    # Retrieve the mean of transport: Car/Bus/Train/Plane
    if transport_means == "Train":
        train = False
    elif transport_means == "Plane":
        plane = False
    elif transport_means == "Car":
        car = False
    elif transport_means == "Bus":
        bus = False
    elif (transport_means == "Ferry") | (transport_means == "Sail"):
        train, bus, car = False, False, False

    trips: list[TripResult] = []
    geometries: list[TripStepGeometry] = []

    # Train
    if train:
        results = train_to_gdf(
            departure_coordinates,
            arrival_coordinates,
            color_usage=cmap["Train"],
            color_infra=cmap["Cons_infra"],
        )
        if results is not None:
            trips.append(TripResult(name="TRAIN", steps=[results.step_data]))
            geometries += results.geometries

    if car or bus:
        if transport_means == "eCar":  # we use custom colors
            cmap_road = colors_custom
        else:
            cmap_road = cmap

        results = car_bus_to_gdf(
            departure_coordinates,
            arrival_coordinates,
            color_usage=cmap_road["Road"],
            color_cons=cmap_road["Cons_infra"],
        )

        if results is None:
            car, bus = False, False
        else:
            if bus:
                trips.append(TripResult(name="BUS", steps=[results.bus_step_data]))
            if car:
                trips.append(TripResult(name="CAR", steps=[results.car_step_data]))

            # We check if car or bus was asked for a 1 step
            if car and bus and transport_means != "eCar":
                geometries += results.geometries

    if plane:
        plane_result = plane_to_gdf(
            departure_coordinates,
            arrival_coordinates,
            color_usage=cmap["Plane"],
            color_contrails=cmap["Contrails"],
        )
        trips.append(TripResult(name="PLANE", steps=[plane_result.step_data]))
        geometries += plane_result.geometries

    return trips, geometries
