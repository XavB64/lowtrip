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
from shapely.geometry import LineString, Point

from geo_split_path_by_country import split_path_by_country
from geo_validate_geometry import validate_geometry
from models import (
    CountrySplitConfig,
    EmissionPart,
    RouteResult,
    TrainStepData,
    TripStepResult,
    TripType,
)
from parameters import train_intensity
from utils import kilometer_to_degree, m_to_km


# Train emissions factors (kgCO2e / passenger.km).
# Sources: SNCF "INFORMATION SUR LA QUANTITE DE GAZ A EFFET DE SERRE EMISE A l'OCCASION D'UNE
# PRESTATION DE TRANSPORT" (2024)
# https://medias.sncf.com/sncfcom/rse/methodologie-generale-infoges.pdf
EF_TRAIN_INFRA = 0.0065


TRAIN_COUNTRY_SPLIT_CONFIG = CountrySplitConfig(
    dataset=train_intensity,
    iso_column="ISO2",
    emission_factor_column="EF_tot",
)


def build_overpass_railway_query(
    coordinates: tuple[float, float],
    search_perimeter_km: float,
):
    """Build an Overpass query to search nearby railway geometries.

    A circular search area is generated around the input coordinates and
    converted to the polygon coordinate format expected by Overpass API.

    Args:
        coordinates: Coordinates as (longitude, latitude).
        search_perimeter_km: Search radius in kilometers.

    Returns:
        An Overpass QL query string.

    """
    # Draw an approximate circular search area around the input coordinates.
    # Since the geometry uses geographic coordinates (EPSG:4326), the buffer
    # radius must be expressed in degrees rather than kilometers.
    search_area = Point(coordinates).buffer(
        kilometer_to_degree(search_perimeter_km),
    )

    # Overpass expects polygon coordinates as: "lat lon lat lon ..."
    polygon_coordinates = " ".join(
        f"{lat} {lon}" for lon, lat in search_area.exterior.coords
    )

    return f"""
        [out:json][timeout:60];
        (
            way(poly:"{polygon_coordinates}")["railway"="rail"];
        );
        out geom;
        """


SEARCH_PERIMETERS_KM = [0.2, 5, 10, 15]


def find_nearest_railway_point(
    coordinates: tuple[float, float],
) -> tuple[float, float] | None:
    """Find a nearby railway point using the Overpass API.

    A search area is built around the input coordinates and queried against
    OpenStreetMap railway geometries. The first coordinate of the first
    railway geometry found within the search perimeter is used as a nearby
    railway point.

    The search radius is progressively increased until a nearby railway point
    is found or all search perimeters are exhausted.

    This function is used as a fallback mechanism when direct train routing
    fails because departure or arrival coordinates are too far from the rail
    network.

    Args:
        coordinates: Coordinates as (longitude, latitude).

    Returns:
        Coordinates of a nearby railway point as (longitude, latitude),
        or None if no railway geometry could be found.

    """
    for search_perimeter in SEARCH_PERIMETERS_KM:
        query = build_overpass_railway_query(coordinates, search_perimeter)

        response = requests.post(
            "http://overpass-api.de/api/interpreter",
            headers={
                "Content-Type": "text/plain",
                "User-Agent": "transport-backend/1.0",
            },
            data=query,
        )

        response_json = response.json()
        if response.status_code == HTTPStatus.OK and response_json["elements"]:
            new_point = response_json["elements"][0]["geometry"][0]
            return new_point["lon"], new_point["lat"]

    return None


def retry_train_routing_with_nearby_points(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
) -> RouteResult | None:
    """Retry train routing using nearby railway points.

    When direct train routing fails, this function searches for nearby railway
    points around the departure and arrival coordinates and retries the routing
    request using these adjusted locations.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).

    Returns:
        A RouteResult containing the route geometry and path length
        if routing succeeds, otherwise None.

    """
    # Look for the closest point from departure on railway
    new_departure_coords = find_nearest_railway_point(departure_coords)
    if new_departure_coords is None:
        return None

    result = request_train_route(new_departure_coords, arrival_coords)
    if result is not None:
        return result

    # Look for the closest point from arrival on railway
    new_arrival_coords = find_nearest_railway_point(arrival_coords)
    if new_arrival_coords is None:
        return None

    return request_train_route(
        new_departure_coords,
        new_arrival_coords,
    )


def request_train_route(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
) -> RouteResult | None:
    """Request a train route between two coordinates.

    The route geometry and path length are retrieved from the Signal
    railway routing API.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).

    Returns:
        A RouteResult containing the route geometry and path length
        if routing succeeds, otherwise None.

    """
    departure_lon, departure_lat = departure_coords
    arrival_lon, arrival_lat = arrival_coords

    url = (
        "https://signal.eu.org/osm/eu/route/v1/train/"
        f"{departure_lon},{departure_lat};"
        f"{arrival_lon},{arrival_lat}"
        "?overview=simplified&geometries=geojson"
    )

    response = requests.get(url)

    if response.status_code != HTTPStatus.OK:
        print(f"Failed to retrieve data. Status code: {response.status_code}")
        return None

    routes = response.json().get("routes")
    if not routes or len(routes) == 0:
        return None

    route = routes[0]
    path_length_km = m_to_km(route["distance"])
    geometry = LineString(route["geometry"]["coordinates"])

    return RouteResult(geometry=geometry, path_length_km=path_length_km)


def compute_train_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
) -> TripStepResult | None:
    """Compute a train trip route and associated emissions.

    A train route is first requested directly from the railway routing API.
    If routing fails, nearby railway points are searched around the departure
    and arrival coordinates and used to retry the routing request.

    Once a valid route is obtained, the geometry is split by country in order
    to apply country-specific train emission factors to each segment of the trip.
    Additional infrastructure emissions are then added to the final result.

    Args:
        departure_coords: Departure coordinates as (longitude, latitude).
        arrival_coords: Arrival coordinates as (longitude, latitude).
        trip_type: Type of trip associated with the computed geometries.

    Returns:
        A TripStepResult containing:
            - train route geometries
            - country-level emission breakdown
            - total traveled distance
        Returns None if no valid train route could be computed.

    """
    result = request_train_route(departure_coords, arrival_coords)

    if result is None:
        result = retry_train_routing_with_nearby_points(
            departure_coords,
            arrival_coords,
        )

    if result is None:
        return None

    validate_geometry(departure_coords, arrival_coords, result.geometry)

    path_length_km = result.path_length_km

    # Split route by country to compute country-specific emissions.
    country_route_segments, geometries = split_path_by_country(
        result.geometry,
        path_length_km,
        TRAIN_COUNTRY_SPLIT_CONFIG,
        trip_type=trip_type,
    )

    emissions = [
        EmissionPart(
            name=segment.country_name,
            kg_co2_eq=round(segment.emission_factor * segment.path_length_km, 2),
            ef_tot=segment.emission_factor,
            distance=round(segment.path_length_km),
        )
        for segment in country_route_segments
    ]
    emissions.append(
        EmissionPart(
            name="infra",
            kg_co2_eq=round(path_length_km * EF_TRAIN_INFRA),
            ef_tot=EF_TRAIN_INFRA,
            distance=round(path_length_km),
        ),
    )

    return TripStepResult(
        step_data=TrainStepData(
            transport="train",
            emissions=emissions,
            path_length=round(path_length_km),
            coeff_upstream=EF_TRAIN_INFRA,
        ),
        geometries=geometries,
    )
