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

import pandas as pd
import requests
from shapely.geometry import LineString

from models import (
    EmissionPart,
    StepData,
    TripStepGeometry,
    TripStepResult,
)
from parameters import (
    EF_bus,
    EF_car,
    EF_ecar,
    route_s,
    val_perimeter,
)
from utils import split_path_by_country, validate_geom as validate_geometry


@dataclass
class CarBusResults:
    """Dataclass for car and bus emissions and road geometry."""

    geometries: list[TripStepGeometry]
    bus_step_data: StepData
    car_step_data: StepData


OSM_ROUTER_URL = "http://router.project-osrm.org/route/v1/driving"


def find_route(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
):
    """Find road path between 2 points
    parameters:
        - departure_coords, arrival_coords : list or tuple like ; (lon, lat).

    Return:
    ------
        - route_geometry : shapely geometry linestring
        - route_length : float, distance in km
        - success : boolean

    """
    response = requests.get(
        f"{OSM_ROUTER_URL}/{departure_coords[0]},{departure_coords[1]};{arrival_coords[0]},{arrival_coords[1]}?overview={route_s}&geometries=geojson",
    )

    if response.status_code != HTTPStatus.OK:
        route_geometry, route_length, success = None, None, False
        return route_geometry, route_length, success

    route = response.json()["routes"][0]
    route_geometry = LineString(
        route["geometry"]["coordinates"],
    )
    route_length = route["distance"] / 1e3  # In km
    success = True

    return route_geometry, route_length, success


def ecar_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    passengers_nb=1,
    validate=val_perimeter,
    color_usage="#ffffff",
    color_cons="#ffffff",
):
    """Parameters
        - departure_coords, arrival_coords
        - validate
        - colormap, list of colors
    return:
        - full dataframe for trains.

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success or not validate_geometry(
        departure_coords,
        arrival_coords,
        route_geometry,
        validate,
    ):
        return None

    # We need to filter by country and add length / Emission factors
    gdf = split_path_by_country(
        route_geometry,
        method="ecar",
        real_path_length=route_length,
    )

    # Add colors
    gdf["colors"] = color_usage

    # Handle nb passengers
    passengers_nb = int(passengers_nb)
    # Compute emissions : EF * length
    gdf["EF_tot"] = (
        gdf["EF_tot"]
        * EF_ecar["fuel"]
        * (1 + 0.04 * (passengers_nb - 1))
        / (1e3 * passengers_nb)
    )  # g/kWh * kWh/km
    gdf["kgCO2eq"] = gdf["path_length"] * gdf["EF_tot"]

    # Add infra and construction
    gdf = pd.concat([
        pd.DataFrame({
            "kgCO2eq": [route_length * EF_ecar["construction"] / passengers_nb],
            "EF_tot": [EF_ecar["construction"]],
            "colors": [color_cons],
            "NAME": ["Construction"],
        }),
        gdf,
    ])
    gdf["label"] = "Road"
    gdf["length"] = str(int(route_length)) + "km (" + gdf["NAME"] + ")"
    gdf.reset_index(inplace=True)

    geo_ecar = gdf[["colors", "label", "geometry", "path_length", "NAME"]].dropna(
        axis=0,
    )

    geometries = []
    for _, row in geo_ecar.iterrows():
        geometries.append(
            TripStepGeometry(
                coordinates=[[list(coord) for coord in row["geometry"].coords]],
                transport_means="Road",
                color=color_usage,
                length=row["path_length"],
                country_label=row["NAME"],
            ),
        )

    emissions_data = gdf[["kgCO2eq", "colors", "NAME", "EF_tot"]].to_dict("records")

    emissions = [
        EmissionPart(
            name=emission_data["NAME"],
            kg_co2_eq=emission_data["kgCO2eq"],
            color=emission_data["colors"],
            ef_tot=emission_data["EF_tot"],
        )
        for emission_data in emissions_data
    ]

    return TripStepResult(
        step_data=StepData(
            transport_means="Ecar",
            emissions=emissions,
            path_length=route_length,
        ),
        geometries=geometries,
    )


def get_car_emissions(
    route_length: float,
    EF_fuel: float,
    EF_construction: float,
    color_usage: str,
    color_construction: str,
) -> list[EmissionPart]:
    return [
        EmissionPart(
            name="Construction",
            kg_co2_eq=route_length * EF_construction,
            ef_tot=EF_construction,
            color=color_construction,
        ),
        EmissionPart(
            name="Fuel",
            kg_co2_eq=route_length * EF_fuel,
            ef_tot=EF_fuel,
            color=color_usage,
        ),
    ]


def get_bus_emissions(
    route_length: float,
    EF_fuel: float,
    EF_construction: float,
    color_usage: str,
    color_construction: str,
) -> list[EmissionPart]:
    return [
        EmissionPart(
            name="Construction",
            kg_co2_eq=route_length * EF_construction,
            ef_tot=EF_construction,
            color=color_construction,
        ),
        EmissionPart(
            name="Fuel",
            kg_co2_eq=route_length * EF_fuel,
            ef_tot=EF_fuel,
            color=color_usage,
        ),
    ]


def get_road_geometry_data(
    route_length: float,
    route_geometry: LineString,
    color_usage: str,
):
    return TripStepGeometry(
        coordinates=[[list(coord) for coord in route_geometry.coords]],
        transport_means="Road",
        color=color_usage,
        length=route_length,
        country_label=None,
    )


def car_bus_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    EF_car=EF_car,
    EF_bus=EF_bus,
    validate=val_perimeter,
    color_usage="#ffffff",
    color_cons="#ffffff",
) -> CarBusResults | None:
    """ONLY FOR FIRST FORM (optimization).

    Parameters
    ----------
        - departure_coords, arrival_coords
        - EF_car, float emission factor for one car by km
        - EF_bus, float emission factor for bus by pkm
        - color, color in hex of path and bar chart
        - validate
    return:
        - CarBusResults or None

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success or not validate_geometry(
        departure_coords,
        arrival_coords,
        route_geometry,
        validate,
    ):
        return None

    road_geometry = get_road_geometry_data(route_length, route_geometry, color_usage)

    car_emissions = get_car_emissions(
        route_length,
        EF_car["fuel"],
        EF_car["construction"],
        color_usage,
        color_cons,
    )

    bus_emissions = get_bus_emissions(
        route_length,
        EF_bus["fuel"],
        EF_bus["construction"],
        color_usage,
        color_cons,
    )

    return CarBusResults(
        geometries=[road_geometry],
        bus_step_data=StepData(
            transport_means="Bus",
            emissions=bus_emissions,
            path_length=route_length,
        ),
        car_step_data=StepData(
            transport_means="Car",
            emissions=car_emissions,
            path_length=route_length,
        ),
    )


def bus_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    EF_bus=EF_bus,
    validate=val_perimeter,
    color_usage="#ffffff",
    color_cons="#ffffff",
) -> TripStepResult | None:
    """Parameters
        - departure_coords, arrival_coords
        - EF_bus, float emission factor for bus by pkm
        - color, color in hex of path and bar chart
        - validate

    Return:
    ------
        - full dataframe for bus or None

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success or not validate_geometry(
        departure_coords,
        arrival_coords,
        route_geometry,
        validate,
    ):
        return None

    road_geometry = get_road_geometry_data(route_length, route_geometry, color_usage)
    emissions = get_bus_emissions(
        route_length,
        EF_bus["fuel"],
        EF_bus["construction"],
        color_usage,
        color_cons,
    )

    return TripStepResult(
        step_data=StepData(
            transport_means="Bus",
            emissions=emissions,
            path_length=route_length,
        ),
        geometries=[road_geometry],
    )


def car_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    EF_car=EF_car,
    validate=val_perimeter,
    passengers_nb=1,
    color_usage="#ffffff",
    color_cons="#ffffff",
) -> TripStepResult | None:
    """Parameters
        - departure_coords, arrival_coords
        - EF_car, float emission factor for one car by km
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip).

    Return:
    ------
        - full dataframe for car or None

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success or not validate_geometry(
        departure_coords,
        arrival_coords,
        route_geometry,
        validate,
    ):
        return None

    if passengers_nb == "👍":  # Hitch-hiking
        EF_fuel = EF_car["fuel"] * 0.04
        EF_cons = 0
    else:
        passengers_nb = int(passengers_nb)
        EF_fuel = EF_car["fuel"] * (1 + 0.04 * (passengers_nb - 1)) / passengers_nb
        EF_cons = EF_car["construction"] / passengers_nb

    geometry = get_road_geometry_data(route_length, route_geometry, color_usage)

    return TripStepResult(
        step_data=StepData(
            transport_means="Car",
            emissions=get_car_emissions(
                route_length,
                EF_fuel,
                EF_cons,
                color_usage,
                color_cons,
            ),
            path_length=route_length,
        ),
        geometries=[geometry],
    )
