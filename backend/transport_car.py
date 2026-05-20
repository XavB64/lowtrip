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
    BusStepData,
    CarStepData,
    EcarStepData,
    EmissionPart,
    TripStepGeometry,
    TripStepResult,
    TripType,
)
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


def compute_ecar_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
    passengers_nb=1,
):
    """Parameters
        - departure_coords, arrival_coords
    return:
        - full dataframe for trains.

    """
    route_geometry, route_length, success = find_route(departure_coords, arrival_coords)

    if not success:
        return None

    # We need to filter by country and add length / Emission factors
    gdf = split_path_by_country(
        route_geometry,
        method="ecar",
        real_path_length=route_length,
    )

    passengers_nb = int(passengers_nb)
    gdf["EF"] /= 1000.0  # Conversion in kg

    gdf["EF_tot"] = (
        gdf["EF"] * EF_ECAR_FUEL * (1 + 0.04 * (passengers_nb - 1)) / passengers_nb
    )
    gdf["kgCO2eq"] = gdf["path_length"] * gdf["EF_tot"]

    # Add infra and construction
    gdf = pd.concat([
        pd.DataFrame({
            "kgCO2eq": [route_length * EF_ECAR_CONSTRUCTION / passengers_nb],
            "EF": [EF_ECAR_CONSTRUCTION],
            "NAME": ["construction"],
            "path_length": [route_length],
        }),
        gdf,
    ])
    gdf["label"] = "Road"
    gdf["length"] = str(int(route_length)) + "km (" + gdf["NAME"] + ")"
    gdf.reset_index(inplace=True)

    geo_ecar = gdf[["label", "geometry", "path_length", "NAME"]].dropna(
        axis=0,
    )

    geometries = []
    for _, row in geo_ecar.iterrows():
        geometries.append(
            TripStepGeometry(
                coordinates=[[list(coord) for coord in row["geometry"].coords]],
                transport_means="Road",
                length=row["path_length"],
                country_label=row["NAME"],
                trip_type=trip_type,
            ),
        )

    emissions_data = gdf[["kgCO2eq", "NAME", "EF", "path_length"]].to_dict(
        "records",
    )

    emissions = [
        EmissionPart(
            name=emission_data["NAME"],
            kg_co2_eq=round(emission_data["kgCO2eq"], 2),
            ef_tot=emission_data["EF"],
            distance=round(emission_data["path_length"]),
        )
        for emission_data in emissions_data
    ]

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
        EF_fuel = EF_CAR_FUEL * 0.04
        EF_construction = 0
    else:
        passengers_nb = int(passengers_nb)
        EF_fuel = EF_CAR_FUEL * (1 + 0.04 * (passengers_nb - 1)) / passengers_nb
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
    """ONLY FOR FIRST FORM (optimization).

    Parameters
    ----------
        - departure_coords, arrival_coords
    return:
        - CarBusResults or None

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
    """Parameters
        - departure_coords, arrival_coords
        - EF_bus, float emission factor for bus by pkm

    Returns
    -------
        - full dataframe for bus or None

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
    """Parameters
        - departure_coords, arrival_coords
        - EF_car, float emission factor for one car by km
        - nb, number of passenger in the car (used only for custom trip).

    Returns
    -------
        - full dataframe for car or None

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
