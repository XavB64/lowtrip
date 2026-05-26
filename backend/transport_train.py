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

import geopandas as gpd
import pandas as pd
import requests
from shapely.geometry import (
    LineString,
    Point,
)

from models import (
    CountrySplitConfig,
    EmissionPart,
    TrainStepData,
    TripStepResult,
    TripType,
)
from parameters import train_intensity
from utils import (
    kilometer_to_degree,
    m_to_km,
    split_path_by_country,
    validate_geometry,
)


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


class GeometryRecognitionError(Exception):
    """Exception raised when the geometry is not recognized."""


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


def extend_search(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
):
    """Function to use when the train path is not found directly by the API.
    We search for nearby coordinates and request it again.

    Parameters
    ----------
        - departure_coords, arrival_coords : list or tuple like with coordinates (lon, lat)
    return:
        - gdf (geoseries)
        - success (bool)

    """
    # We extend the search progressively
    new_departure_coords = find_nearest_railway_point(departure_coords)

    if new_departure_coords is None:
        # Then we will find nothing
        gdf = pd.DataFrame()
        success = False
        train_dist = None

    else:
        # We can retry the API
        gdf, success, train_dist = find_train(new_departure_coords, arrival_coords)
        if success == False:
            # We can change arrival_coords
            new_arrival_coords = find_nearest_railway_point(arrival_coords)

            # Verify that we want to try to request the API again
            if new_arrival_coords is not None:
                gdf, success, train_dist = find_train(
                    new_departure_coords,
                    new_arrival_coords,
                )

    return gdf, success, train_dist


def find_train(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    method="signal",
):
    """Find train path between 2 points. Can use ntag API or signal.

    Parameters
    ----------
        - departure_coords, arrival_coords : list or tuple like (lon, lat)
        - method : signal / trainmap
    return:
        - geometry, a LineString or None
        - success, boolean

    """
    # Build the request url
    if method == "trainmap":
        url = f"https://trainmap.ntag.fr/api/route?dep={departure_coords[0]},{departure_coords[1]}&arr={arrival_coords[0]},{arrival_coords[1]}&simplify=1"

    else:
        url = (
            f"https://signal.eu.org/osm/eu/route/v1/train/{departure_coords[0]},{departure_coords[1]};{arrival_coords[0]},{arrival_coords[1]}"
            "?overview=simplified&geometries=geojson"
        )

    # Send the GET request
    response = requests.get(url)

    # Check if the request was not successful
    if response.status_code != HTTPStatus.OK:
        print(f"Failed to retrieve data. Status code: {response.status_code}")
        geometry, success, train_dist = None, False, 0
        # We will try to request again with overpass
        return geometry, success, train_dist

    if method == "trainmap":
        geometry = LineString(response.json()["geometry"]["coordinates"][0])
    else:
        train_dist = m_to_km(response.json()["routes"][0]["distance"])
        geometry = LineString(response.json()["routes"][0]["geometry"]["coordinates"])

    success = True

    return geometry, success, train_dist


def compute_train_trip(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    trip_type: TripType,
):
    """Find the train path between 2 points and compute the emissions of the path.

    Parameters
    ----------
        - departure_coords, arrival_coords

    Returns
    -------
        - full dataframe for trains

    Raises
    ------
        If the geometry is not recognized.

    """
    # First try with coordinates supplied by the user
    geometry, success, train_dist = find_train(departure_coords, arrival_coords)

    # If failure then we try to find a better spot nearby - Put in another function
    if success == False:
        # We try to search nearby the coordinates and request again
        geometry, success, train_dist = extend_search(
            departure_coords,
            arrival_coords,
        )

    # Validation part for train
    if not success or not validate_geometry(
        departure_coords,
        arrival_coords,
        gpd.GeoSeries(
            geometry,
            crs="epsg:4326",
        ).values[0],
    ):
        return None

    # Split path by country and compute the length and the emission factor for each part of the path
    country_route_segments, geometries = split_path_by_country(
        geometry,
        train_dist,
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
            kg_co2_eq=round(train_dist * EF_TRAIN_INFRA),
            ef_tot=EF_TRAIN_INFRA,
            distance=round(train_dist),
        ),
    )

    return TripStepResult(
        step_data=TrainStepData(
            transport="train",
            emissions=emissions,
            path_length=round(train_dist),
            coeff_upstream=EF_TRAIN_INFRA,
        ),
        geometries=geometries,
    )
