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

from models import TripStepGeometry
from parameters import (
    EF_bus,
    EF_car,
    EF_ecar,
    route_s,
    val_perimeter,
)
from utils import split_path_by_country, validate_geom as validate_geometry


@dataclass
class Emission:
    """Emission dataclass."""

    kg_co2_eq: float
    ef_tot: float
    color: str


@dataclass
class CarEmissions:
    """Car and bus have two sources of emissions: construction and fuel."""

    fuel: Emission
    construction: Emission


@dataclass
class ECarEmission:
    """Emission dataclass for Ecar."""

    name: str
    kg_co2_eq: float
    color: str


@dataclass
class ECarStepResults:
    """Dataclass for electric car emissions and geometry."""

    geometries: TripStepGeometry
    emissions: list[ECarEmission]
    path_length: float
    passengers_label: str


@dataclass
class CarBusResults:
    """Dataclass for car and bus emissions and road geometry."""

    geometry: list[TripStepGeometry]
    bus_emissions: CarEmissions
    car_emissions: CarEmissions
    path_length: float


@dataclass
class BusStepResults:
    """Dataclass for bus emissions and geometry."""

    geometry: TripStepGeometry
    emissions: CarEmissions
    path_length: float


@dataclass
class CarStepResults:
    """Dataclass for car emissions and geometry."""

    geometry: TripStepGeometry
    emissions: CarEmissions
    path_length: float
    passengers_label: str


def e_car_emissions_to_pd_objects(
    e_car_step: ECarStepResults,
) -> pd.DataFrame:
    res = {"kgCO2eq": [], "colors": [], "NAME": [], "Mean of Transport": []}
    for emission in e_car_step.emissions:
        res["kgCO2eq"].append(emission.kg_co2_eq)
        res["colors"].append(emission.color)
        res["NAME"].append(emission.name)
        res["Mean of Transport"].append(f"eCar {e_car_step.passengers_label}")
    return pd.DataFrame(res)


def bus_emissions_to_pd_objects(
    busStep: BusStepResults,
) -> pd.DataFrame:
    return pd.DataFrame({
        "kgCO2eq": [
            busStep.emissions.construction.kg_co2_eq,
            busStep.emissions.fuel.kg_co2_eq,
        ],
        "EF_tot": [
            busStep.emissions.construction.ef_tot,
            busStep.emissions.fuel.ef_tot,
        ],
        "path_length": [busStep.path_length, busStep.path_length],
        "colors": [
            busStep.emissions.construction.color,
            busStep.emissions.fuel.color,
        ],
        "NAME": ["Construction", "Fuel"],
        "Mean of Transport": ["Bus", "Bus"],
    })


def car_emissions_to_pd_objects(
    carStep: CarStepResults,
) -> pd.DataFrame:
    return pd.DataFrame({
        "kgCO2eq": [
            carStep.emissions.construction.kg_co2_eq,
            carStep.emissions.fuel.kg_co2_eq,
        ],
        "EF_tot": [
            carStep.emissions.construction.ef_tot,
            carStep.emissions.fuel.ef_tot,
        ],
        "path_length": [carStep.path_length, carStep.path_length],
        "colors": [
            carStep.emissions.construction.color,
            carStep.emissions.fuel.color,
        ],
        "NAME": ["Construction", "Fuel"],
        "Mean of Transport": [
            f"Car {carStep.passengers_label}",
            f"Car {carStep.passengers_label}",
        ],
    })


def car_bus_emissions_to_pd_objects(
    results: CarBusResults,
) -> (pd.DataFrame, pd.DataFrame):
    car_data = pd.DataFrame({
        "kgCO2eq": [
            results.car_emissions.construction.kg_co2_eq,
            results.car_emissions.fuel.kg_co2_eq,
        ],
        "EF_tot": [
            results.car_emissions.construction.ef_tot,
            results.car_emissions.fuel.ef_tot,
        ],
        "path_length": [results.path_length, results.path_length],
        "colors": [
            results.car_emissions.construction.color,
            results.car_emissions.fuel.color,
        ],
        "NAME": ["Construction", "Fuel"],
        "Mean of Transport": ["Car 1p.", "Car 1p."],
    })
    bus_data = pd.DataFrame({
        "kgCO2eq": [
            results.bus_emissions.construction.kg_co2_eq,
            results.bus_emissions.fuel.kg_co2_eq,
        ],
        "EF_tot": [
            results.bus_emissions.construction.ef_tot,
            results.bus_emissions.fuel.ef_tot,
        ],
        "path_length": [results.path_length, results.path_length],
        "colors": [
            results.bus_emissions.construction.color,
            results.bus_emissions.fuel.color,
        ],
        "NAME": ["Construction", "Fuel"],
        "Mean of Transport": ["Bus", "Bus"],
    })
    return car_data, bus_data


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

    emissions_data = gdf[["kgCO2eq", "colors", "NAME"]].to_dict("records")

    emissions = [
        ECarEmission(
            name=emission_data["NAME"],
            kg_co2_eq=emission_data["kgCO2eq"],
            color=emission_data["colors"],
        )
        for emission_data in emissions_data
    ]

    return ECarStepResults(
        geometries=geometries,
        emissions=emissions,
        path_length=route_length,
        passengers_label=f"{passengers_nb}p.",
    )


def get_car_emissions(
    route_length: float,
    EF_fuel: float,
    EF_construction: float,
    color_usage: str,
    color_construction: str,
    passengers_label: str,
    geometry: pd.DataFrame,
) -> CarStepResults:
    return CarStepResults(
        geometry=geometry,
        emissions=CarEmissions(
            fuel=Emission(
                kg_co2_eq=route_length * EF_fuel,
                ef_tot=EF_fuel,
                color=color_usage,
            ),
            construction=Emission(
                kg_co2_eq=route_length * EF_construction,
                ef_tot=EF_construction,
                color=color_construction,
            ),
        ),
        path_length=route_length,
        passengers_label=passengers_label,
    )


def get_bus_emissions(
    route_length: float,
    EF_fuel: float,
    EF_construction: float,
    color_usage: str,
    color_construction: str,
    geometry: pd.DataFrame,
) -> BusStepResults:
    return BusStepResults(
        geometry=geometry,
        emissions=CarEmissions(
            fuel=Emission(
                kg_co2_eq=route_length * EF_fuel,
                ef_tot=EF_fuel,
                color=color_usage,
            ),
            construction=Emission(
                kg_co2_eq=route_length * EF_construction,
                ef_tot=EF_construction,
                color=color_construction,
            ),
        ),
        path_length=route_length,
    )


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

    car_data: CarStepResults = get_car_emissions(
        route_length,
        EF_car["fuel"],
        EF_car["construction"],
        color_usage,
        color_cons,
        "1p.",
        road_geometry,
    )

    bus_data: BusStepResults = get_bus_emissions(
        route_length,
        EF_bus["fuel"],
        EF_bus["construction"],
        color_usage,
        color_cons,
        road_geometry,
    )

    return CarBusResults(
        geometry=road_geometry,
        bus_emissions=bus_data.emissions,
        car_emissions=car_data.emissions,
        path_length=route_length,
    )


def bus_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    EF_bus=EF_bus,
    validate=val_perimeter,
    color_usage="#ffffff",
    color_cons="#ffffff",
) -> BusStepResults | None:
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

    return get_bus_emissions(
        route_length,
        EF_bus["fuel"],
        EF_bus["construction"],
        color_usage,
        color_cons,
        road_geometry,
    )


def car_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    EF_car=EF_car,
    validate=val_perimeter,
    passengers_nb=1,
    color_usage="#ffffff",
    color_cons="#ffffff",
) -> CarStepResults | None:
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
        passengers_label = "👍"
    else:
        passengers_nb = int(passengers_nb)
        EF_fuel = EF_car["fuel"] * (1 + 0.04 * (passengers_nb - 1)) / passengers_nb
        EF_cons = EF_car["construction"] / passengers_nb
        passengers_label = f"{passengers_nb}p."

    road_geometry = get_road_geometry_data(route_length, route_geometry, color_usage)

    return get_car_emissions(
        route_length,
        EF_fuel,
        EF_cons,
        color_usage,
        color_cons,
        passengers_label,
        road_geometry,
    )
