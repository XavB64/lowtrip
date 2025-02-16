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

import pandas as pd
from pyproj import Geod
from shapely.geometry import LineString

from models import TripStepGeometry


@dataclass
class Emission:
    """Class for emission."""

    kg_co2_eq: float
    ef_tot: float
    color: str


@dataclass
class PlaneEmissions:
    """Plane has two types of emissions: kerosene and contrails."""

    kerosene: Emission
    contrails: Emission


@dataclass
class PlaneStepResults:
    """Class for plane step results."""

    geometry: TripStepGeometry
    emissions: PlaneEmissions


def plane_emissions_to_pd_objects(
    planeStep: PlaneStepResults,
) -> pd.DataFrame:
    return pd.DataFrame({
        "kgCO2eq": [
            planeStep.emissions.kerosene.kg_co2_eq,
            planeStep.emissions.contrails.kg_co2_eq,
        ],
        "EF_tot": [
            planeStep.emissions.kerosene.ef_tot,
            planeStep.emissions.contrails.ef_tot,
        ],
        "colors": [
            planeStep.emissions.kerosene.color,
            planeStep.emissions.contrails.color,
        ],
        "NAME": ["Kerosene", "Contrails"],
        "Mean of Transport": ["Plane", "Plane"],
    })


EF_plane = {
    "short": {
        "construction": 0.00038,
        "upstream": 0.0242,
        "combustion": 0.117,
        "infra": 0.0003,
    },
    "medium": {
        "construction": 0.00036,
        "upstream": 0.0176,
        "combustion": 0.0848,
        "infra": 0.0003,
    },
    "long": {
        "construction": 0.00026,
        "upstream": 0.0143,
        "combustion": 0.0687,
        "infra": 0.0003,
    },
}


# Number of points in plane geometry
POINTS_NB = 100

# Additional emissions from plane
CONTRAILS_COEFF = 2
HOLD = 3.81  # kg/p
DETOUR_COEFF = 1.076


def great_circle_geometry(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
):
    """Create the great circle geometry with pyproj.

    parameters: departure_coords, arrival_coords

    Return:
        - shapely geometry (Linestring)
        - Geodesic distance in km

    """
    geod = Geod(ellps="WGS84")

    # returns a list of longitude/latitude pairs describing n points equally spaced
    # intermediate points along the geodesic between the initial and terminus points.
    r = geod.inv_intermediate(
        lon1=float(departure_coords[0]),
        lat1=float(departure_coords[1]),
        lon2=float(arrival_coords[0]),
        lat2=float(arrival_coords[1]),
        npts=POINTS_NB,
        initial_idx=0,
        terminus_idx=0,
    )

    # Create the geometry
    # Displaying results over the antimeridian
    if abs(min(r.lons) - max(r.lons)) > 180:
        # Then the other way is faster, we add 360° to the destination with neg lons
        l = [
            [lon, lat]
            for lon, lat in zip(
                [lon + 360 if lon < 0 else lon for lon in r.lons],
                r.lats,
            )
        ]
    else:
        l = [[lon, lat] for lon, lat in zip(r.lons, r.lats)]

    return LineString(l), r.dist / 1e3  # in km


def plane_to_gdf(
    departure_coords: tuple[float, float],
    arrival_coords: tuple[float, float],
    EF_plane=EF_plane,
    contrails=CONTRAILS_COEFF,
    holding=HOLD,
    detour=DETOUR_COEFF,
    color_usage="#ffffff",
    color_contrails="#ffffff",
) -> PlaneStepResults:
    """Parameters
        - departure_coords, arrival_coords
        - EF : emission factor in gCO2/pkm for plane depending on journey length
        - contrails : coefficient to apply to take into account non-CO2 effects
        - holding : additional CO2 emissions (kg) due to holding patterns
        - color : color for path and bar chart
        - color_contrails : color for non CO2-effects in bar chart
    return:
        - full dataframe for plane, geometry for CO2 only (optimization).

    """
    # Compute geometry and distance (geodesic)
    plane_geometry, route_length = great_circle_geometry(
        departure_coords,
        arrival_coords,
    )

    # Different emission factors depending on the trip length
    if route_length < 1000:
        trip_category = "short"
    elif route_length < 3500:
        trip_category = "medium"
    else:
        trip_category = "long"

    # detour coeffient
    route_length *= detour

    emissions_factors = EF_plane[trip_category]
    CO2_factors = emissions_factors["combustion"] + emissions_factors["upstream"]
    non_CO2_factors = emissions_factors["combustion"] * contrails

    return PlaneStepResults(
        geometry=TripStepGeometry(
            coordinates=[[list(coord) for coord in plane_geometry.coords]],
            transport_means="Flight",
            length=route_length,
            color=color_usage,
            country_label=None,
        ),
        emissions=PlaneEmissions(
            kerosene=Emission(
                kg_co2_eq=route_length * CO2_factors + holding,
                ef_tot=CO2_factors,
                color=color_usage,
            ),
            contrails=Emission(
                kg_co2_eq=route_length * non_CO2_factors,
                ef_tot=non_CO2_factors,
                color=color_contrails,
            ),
        ),
    )
