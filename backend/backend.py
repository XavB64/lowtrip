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
import geopandas as gpd
import pandas as pd
from pyproj import Geod

# Geometry
from shapely.geometry import LineString

from models import TripStep
from parameters import (
    colors_custom,
    colors_direct,
    min_plane_dist,
)
from transport_bicycle import bicycle_emissions_to_pd_objects, bicycle_to_gdf
from transport_car import (
    bus_emissions_to_pd_objects,
    bus_to_gdf,
    car_bus_emissions_to_pd_objects,
    car_bus_to_gdf,
    car_emissions_to_pd_objects,
    car_to_gdf,
    e_car_emissions_to_pd_objects,
    ecar_to_gdf,
)
from transport_ferry import (
    ferry_emissions_to_pd_objects,
    ferry_to_gdf,
    sail_emissions_to_pd_objects,
    sail_to_gdf,
)
from transport_plane import plane_emissions_to_pd_objects, plane_to_gdf
from transport_train import train_emissions_to_pd_objects, train_to_gdf


######################
#### Functions #######
######################


def compute_emissions_custom(trip_inputs: list[TripStep], cmap=colors_custom):
    """Parameters
        - trip_inputs, inputs of the trip

    Return:
    ------
        - full dataframe for emissions
        - geodataframe for path
        - ERROR : string first step that fails

    """
    ERROR = ""

    emissions_data = []
    geo = []
    fail = False  # To check if the query is successfull

    for idx in range(len(trip_inputs) - 1):  # We loop until last departure
        # Departure coordinates
        depature = trip_inputs[idx]
        departure_coordinates = (depature.lon, depature.lat)

        # Arrival coordinates
        arrival = trip_inputs[idx + 1]
        arrival_coordinates = (arrival.lon, arrival.lat)

        # Mean of transport
        transportmean = arrival.transport_means

        # Compute depending on the mean of transport
        if transportmean == "Train":
            results = train_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Train"],
                color_infra=cmap["Cons_infra"],
            )
            if results is None:  # Step is not successful
                fail = True
                ERROR = (
                    "step n°"
                    + str(int(idx) + 1)
                    + " failed with Train, please change mean of transport or locations. "
                )
                break
            data_train, geo_train = train_emissions_to_pd_objects(results)
            data_train["step"] = str(int(idx) + 1)
            emissions_data.append(data_train)
            geo.append(geo_train)

        elif transportmean == "Bus":
            results = bus_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Road"],
                color_cons=cmap["Cons_infra"],
            )
            if results is None:
                fail = True
                ERROR = (
                    "step n°"
                    + str(int(idx) + 1)
                    + " failed with Bus, please change mean of transport or locations. "
                )
                break
            data_bus, geo_bus = bus_emissions_to_pd_objects(results)
            data_bus["step"] = str(int(idx) + 1)
            emissions_data.append(data_bus)
            geo.append(geo_bus)

        elif transportmean == "Car":
            results = car_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                passengers_nb=arrival.passengers_nb,
                color_usage=cmap["Road"],
                color_cons=cmap["Cons_infra"],
            )
            if results is None:  # Step is not successful
                fail = True
                ERROR = (
                    "step n°"
                    + str(int(idx) + 1)
                    + " failed with Car, please change mean of transport or locations. "
                )
                break
            data_car, geo_car = car_emissions_to_pd_objects(results)
            data_car["step"] = str(int(idx) + 1)
            emissions_data.append(data_car)  # gdf_car.copy()
            geo.append(geo_car)

        elif transportmean == "eCar":
            results = ecar_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                passengers_nb=arrival.passengers_nb,
                color_usage=cmap["Road"],
                color_cons=cmap["Cons_infra"],
            )
            if results is None:  # Step is not successful
                fail = True
                ERROR = (
                    "step n°"
                    + str(int(idx) + 1)
                    + " failed with eCar, please change mean of transport or locations. "
                )
                break
            data_ecar, geo_ecar = e_car_emissions_to_pd_objects(results)
            data_ecar["step"] = str(int(idx) + 1)
            emissions_data.append(data_ecar)
            geo.append(geo_ecar)

        elif transportmean == "Bicycle":
            results = bicycle_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color=cmap["Bicycle"],
            )
            if results is None:  # Step is not successful
                fail = True
                ERROR = (
                    "step n°"
                    + str(int(idx) + 1)
                    + " failed with Bicycle, please change mean of transport or locations. "
                )
                break
            data_bike, geo_bike = bicycle_emissions_to_pd_objects(results)
            data_bike["step"] = str(int(idx) + 1)
            emissions_data.append(data_bike)
            geo.append(geo_bike)

        elif transportmean == "Plane":
            plane_results = plane_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Plane"],
                color_contrails=cmap["Contrails"],
            )
            data_plane, geo_plane = plane_emissions_to_pd_objects(plane_results)
            data_plane["step"] = str(int(idx) + 1)
            emissions_data.append(data_plane)
            geo.append(geo_plane)

        elif transportmean == "Ferry":
            results = ferry_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Ferry"],
                options=arrival.options,
            )
            data_ferry, geo_ferry = ferry_emissions_to_pd_objects(results)
            data_ferry["step"] = str(int(idx) + 1)
            emissions_data.append(data_ferry)
            geo.append(geo_ferry)

        elif transportmean == "Sail":
            results = sail_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                color_usage=cmap["Ferry"],
            )
            data_sail, geo_sail = sail_emissions_to_pd_objects(results)
            data_sail["step"] = str(int(idx) + 1)
            emissions_data.append(data_sail)
            geo.append(geo_sail)

    if fail:
        # One or more step weren't successful, we return nothing
        data_custom = pd.DataFrame()
        geodata = pd.DataFrame()
    else:
        # Query successfull, we concatenate the data
        data_custom = pd.concat(emissions_data)
        data_custom = data_custom.reset_index(drop=True)  # .drop("geometry", axis=1)
        # Geodataframe for map
        geodata = gpd.GeoDataFrame(pd.concat(geo), geometry="geometry", crs="epsg:4326")

    return data_custom, geodata, ERROR


def compute_emissions_all(data, cmap=colors_direct):
    """If data is only one step then we do not compute this mean of transport as it will
    appear in "my_trip"
    parameters:
        - data, pandas dataframe format (will be json).

    Return:
    ------
        - full dataframe for emissions
        - geodataframe for path

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
    l_data = []
    geo = []

    # Train
    if train:
        results = train_to_gdf(
            tag1,
            tag2,
            color_usage=cmap["Train"],
            color_infra=cmap["Cons_infra"],
        )
        if results is not None:
            data_train, geo_train = train_emissions_to_pd_objects(results)
            l_data.append(data_train)
            geo.append(geo_train)

    # Car or Bus
    route_added = False
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
            car_data, bus_data, geometry = car_bus_emissions_to_pd_objects(results)

            if bus:
                l_data.append(bus_data)
            if car:
                l_data.append(car_data)

            # We check if car or bus was asked for a 1 step
            if car and bus and transp != "eCar":
                geo.append(geometry)
                route_added = True

    # Plane
    if plane:
        plane_result = plane_to_gdf(
            tag1,
            tag2,
            color_usage=cmap["Plane"],
            color_contrails=cmap["Contrails"],
        )
        data_plane, geo_plane = plane_emissions_to_pd_objects(plane_result)
        l_data.append(data_plane)
        geo.append(geo_plane)

    # We do not add the ferry in the general case

    if not car and not bus and not train and not plane:
        # Only happens when plane was asked and the API failed
        data, geodata = pd.DataFrame(), pd.DataFrame()
    else:
        # Data for bar chart
        data = pd.concat(l_data).reset_index(drop=True)
        if not route_added and not train and not plane:
            geodata = pd.DataFrame()
        else:
            geodata = gpd.GeoDataFrame(
                pd.concat(geo),
                geometry="geometry",
                crs="epsg:4326",
            )

    return data, geodata


def chart_refactor(mytrip, alternative=None, do_alt=False):
    """This function prepare the data to be displayed in the chart correctly
    parameters:
        - mytrip, dataframe of custom trip
        - alternative, dataframe of alternative trip if requested
        - do_alt (bool), is there an alternative trip ?
    return:
        - data with changed fields for bar chart.
    """
    # Check if my trip worked
    if mytrip.shape[0] > 0:
        # Merging means of transport for custom trips
        mytrip["NAME"] = (
            mytrip["step"] + ". " + mytrip["Mean of Transport"] + " - " + mytrip["NAME"]
        )  # + ' - ' + mytrip.index.map(str) + '\''
        # Separtating bars
        mytrip["Mean of Transport"] = "MyTrip"
        # mytrip = mytrip[l_var]

    if do_alt:
        # Check if it worked
        if alternative.shape[0] > 0:
            # We have to render alternative as well
            alternative["NAME"] = (
                alternative["step"]
                + ". "
                + alternative["Mean of Transport"]
                + " - "
                + alternative["NAME"]
                + " "
            )  # + ' - ' + alternative.index.map(str)
            alternative["Mean of Transport"] = "OtherTrip"
            # Then we return both

        return mytrip, alternative

    # If it didnt work we return it (empty)
    return mytrip
