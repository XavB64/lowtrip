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

import pandas as pd
from pyproj import Geod
from shapely.geometry import LineString

from parameters import (
    cont_coeff,
    detour,
    EF_plane,
    hold,
    nb_pts,
)


def great_circle_geometry(dep, arr, nb=nb_pts):
    """Create the great circle geometry with pyproj
    parameters:
        - nb : number of points
        - dep, arr : departure and arrival
    return:
        - shapely geometry (Linestring)
        - Geodesic distance in km.
    """
    # projection
    geod = Geod(ellps="WGS84")
    # returns a list of longitude/latitude pairs describing npts equally spaced
    # intermediate points along the geodesic between the initial and terminus points.
    r = geod.inv_intermediate(
        lon1=float(dep[0]),
        lat1=float(dep[1]),
        lon2=float(arr[0]),
        lat2=float(arr[1]),
        npts=nb,
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

    # Return geometry and distance
    return LineString(l), r.dist / 1e3  # in km


def plane_to_gdf(
    tag1,
    tag2,
    EF_plane=EF_plane,
    contrails=cont_coeff,
    holding=hold,
    detour=detour,
    color_usage="#ffffff",
    color_cont="#ffffff",
):
    """Parameters
        - tag1, tag2
        - EF : emission factor in gCO2/pkm for plane depending on journey length
        - contrails : coefficient to apply to take into account non-CO2 effects
        - holding : additional CO2 emissions (kg) due to holding patterns
        - color : color for path and bar chart
        - color_contrails : color for non CO2-effects in bar chart
    return:
        - full dataframe for plane, geometry for CO2 only (optimization).

    """
    # Compute geometry and distance (geodesic)
    geom_plane, bird = great_circle_geometry(tag1, tag2)

    # Different emission factors depending on the trip length
    if bird < 1000:
        trip_category = "short"
    elif bird < 3500:
        trip_category = "medium"
    else:  # It's > 3500
        trip_category = "long"
    # detour_coeffient
    bird *= detour

    emissions_factors = EF_plane[trip_category]
    CO2_factors = emissions_factors["combustion"] + emissions_factors["upstream"]
    non_CO2_factors = emissions_factors["combustion"] * contrails

    data_plane = pd.DataFrame({
        "kgCO2eq": [
            bird * CO2_factors + holding,
            bird * non_CO2_factors,
        ],
        "EF_tot": [
            CO2_factors,
            non_CO2_factors,
        ],
        "colors": [color_usage, color_cont],
        "NAME": ["Kerosene", "Contrails"],
        "Mean of Transport": ["Plane", "Plane"],
    })
    # Geo plane
    geo_plane = pd.DataFrame(
        pd.Series({
            "colors": color_usage,
            "label": "Flight",
            "length": str(int(bird)) + "km",
            "geometry": geom_plane,
        }),
    ).transpose()
    return data_plane, geo_plane
