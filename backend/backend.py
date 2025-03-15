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


def compute_emissions_custom(
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
        transportmean = arrival.transport_means
        results = None

        # Compute depending on the mean of transport
        if transportmean == "Train":
            results = train_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Train"],
                color_infra=cmap["Cons_infra"],
            )

        elif transportmean == "Bus":
            results = bus_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Road"],
                color_cons=cmap["Cons_infra"],
            )

        elif transportmean == "Car":
            results = car_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                passengers_nb=arrival.passengers_nb,
                color_usage=cmap["Road"],
                color_cons=cmap["Cons_infra"],
            )

        elif transportmean == "eCar":
            results = ecar_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                passengers_nb=arrival.passengers_nb,
                color_usage=cmap["Road"],
                color_cons=cmap["Cons_infra"],
            )

        elif transportmean == "Bicycle":
            results = bicycle_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color=cmap["Bicycle"],
            )

        elif transportmean == "Plane":
            results = plane_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Plane"],
                color_contrails=cmap["Contrails"],
            )

        elif transportmean == "Ferry":
            results = ferry_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Ferry"],
                options=arrival.options,
            )

        elif transportmean == "Sail":
            results = sail_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Ferry"],
            )

        if results is None:  # Step is not successful
            error_message = f"step n°{int(idx) + 1} failed with {transportmean}, please change mean of transport or locations."
            raise ValueError(error_message)

        emissions_data.append(results.step_data)
        geometries += results.geometries

    return TripResult(name=name, steps=emissions_data), geometries


def compute_emissions_all(data, cmap=colors_direct):
    """If data is only one step then we do not compute this mean of transport as it will
    appear in "my_trip"
    parameters:
        - data, pandas dataframe format (will be json).

    Return:
    ------
        - full dataframe for emissions
        - geometries for path

    """
    # Direct trip
    # Departure coordinates
    lon = data.loc[0].lon
    lat = data.loc[0].lat
    tag1 = (lon, lat)
    # Arrival coordinates
    lon = data.loc[data.shape[0] - 1].lon
    lat = data.loc[data.shape[0] - 1].lat
    tag2 = (lon, lat)

    # Check if we should compute it or not
    train, plane, car, bus = True, True, True, True
    # Sea modes - to do later : similar behavior than bus / car --> Custom function to get the route only once
    # ferry, sail = False, False

    # Check distance for plane
    geod = Geod(ellps="WGS84")
    if geod.geometry_length(LineString([tag1, tag2])) / 1e3 < min_plane_dist:
        # Then we do not suggest the plane solution
        plane = False

    # Retrieve the mean of transport: Car/Bus/Train/Plane
    transp = data.loc[1].transport_means
    if transp == "Train":
        train = False
    elif transp == "Plane":
        plane = False
    elif transp == "Car":
        car = False
    elif transp == "Bus":
        bus = False
    elif (transp == "Ferry") | (transp == "Sail"):
        train, bus, car = False, False, False

    # Loop
    trips: list[TripResult] = []
    geometries: list[TripStepGeometry] = []

    # Train
    if train:
        results = train_to_gdf(
            tag1,
            tag2,
            color_usage=cmap["Train"],
            color_infra=cmap["Cons_infra"],
        )
        if results is not None:
            trips.append(TripResult(name="TRAIN", steps=[results.step_data]))
            geometries += results.geometries

    # Car or Bus
    if car or bus:
        if transp == "eCar":  # we use custom colors
            cmap_road = colors_custom
        else:
            cmap_road = cmap

        results = car_bus_to_gdf(
            tag1,
            tag2,
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
            if car and bus and transp != "eCar":
                geometries += results.geometries

    # Plane
    if plane:
        plane_result = plane_to_gdf(
            tag1,
            tag2,
            color_usage=cmap["Plane"],
            color_contrails=cmap["Contrails"],
        )
        trips.append(TripResult(name="PLANE", steps=[plane_result.step_data]))
        geometries += plane_result.geometries

    # We do not add the ferry in the general case

    return trips, geometries
