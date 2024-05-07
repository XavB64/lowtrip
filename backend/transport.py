# #     Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

# #     Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

    # # This program is free software: you can redistribute it and/or modify
    # # it under the terms of the GNU Affero General Public License as published
    # # by the Free Software Foundation, either version 3 of the License, or
    # # (at your option) any later version.

    # # This program is distributed in the hope that it will be useful,
    # # but WITHOUT ANY WARRANTY; without even the implied warranty of
    # # MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    # # GNU Affero General Public License for more details.

    # # You should have received a copy of the GNU Affero General Public License
    # # along with this program.  If not, see <https://www.gnu.org/licenses/>.

from parameters import(
    EF_bycicle, 
    EF_bus,
    EF_car,
    EF_ecar,
    EF_ferry,
    EF_sail,
    EF_plane,
    EF_train,
    search_perimeter,
    val_perimeter, 
    hold,
    cont_coeff,
    detour,
)

from utils import(
    validate_geom,
    extend_search,
    filter_countries_world,
    great_circle_geometry,
    find_bicycle,
    find_route,
    find_train,
    gdf_lines,
    get_shortest_path
)

import pandas as pd
import numpy as np
from pyproj import Geod
#Need for ferry if straight line
#from shapely.geometry import LineString
import geopandas as gpd

def bicycle_to_gdf(
    tag1, tag2, EF=EF_bycicle, color="#ffffff", validate=val_perimeter
):
    """
    parameters:
        - tag1, tag2
        - EF_bus, float emission factor for bike by pkm
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip)
    return:
        - full dataframe for bike
    """
    ### Route OSRM - create a separate function
    geom_route, route, route_dist = find_bicycle(tag1, tag2)

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route, route_dist = None, False, None

    if route:
        #Chart data
        data_bike = pd.DataFrame(
                {
                    "kgCO2eq": [EF * route_dist],
                    "EF_tot": [EF],
                    "path_length": [route_dist],
                    "colors": [color],
                    "NAME": ["Bike-build"],
                    "Mean of Transport": ["Bicycle"],
                }
            )
        #Geo_data
        gdf_bike = pd.DataFrame(
                {
                    "colors": [color],
                    "label": ["Bike"],
                    "length": str(int(route_dist)) + "km",
                    "geometry": [geom_route],
                }
        )
        
    else:
        data_bike, gdf_bike = pd.DataFrame(), pd.DataFrame()
    return data_bike, gdf_bike, route


def train_to_gdf(
    tag1, tag2, perims=search_perimeter, EF_train = EF_train, validate=val_perimeter,
    color_usage = "#ffffff", color_infra="#ffffff"
):  # charte_mollow
    """
    parameters:
        - tag1, tag2
        - perims
        - validate
        - colormap, list of colors
    return:
        - full dataframe for trains
    """
    # First try with coordinates supplied by the user
    gdf, train, train_dist = find_train(tag1, tag2)

    # If failure then we try to find a better spot nearby - Put in another function
    if train == False:
        # We try to search nearby the coordinates and request again
        gdf, train, train_dist= extend_search(tag1, tag2, perims)

    # Validation part for train
    if train:  # We have a geometry
        if not validate_geom(tag1, tag2, gdf.values[0], validate):
            return pd.DataFrame(), pd.DataFrame(), False

        else :  # We need to filter by country and add length / Emission factors
            gdf = filter_countries_world(gdf, method = 'train')
            # Adding and computing emissions
            l_length = []
            # Compute the true distance
            geod = Geod(ellps="WGS84")
            for geom in gdf.geometry.values:
                l_length.append(geod.geometry_length(geom) / 1e3)
            # Add the distance to the dataframe
            gdf["path_length"] = l_length
            #Rescale the length with train_dist (especially when simplified = True)
            print('Rescaling factor', train_dist / gdf["path_length"].sum())
            gdf["path_length"] = gdf["path_length"] * (train_dist / gdf["path_length"].sum())
            # Compute emissions : EF * length
            gdf["EF_tot"] = gdf["EF_tot"] / 1e3  # Conversion in in kg
            gdf["kgCO2eq"] = gdf["path_length"] * gdf["EF_tot"]
            # Add colors, here discretise the colormap
            gdf["colors"] = color_usage
            # Write
            gdf = pd.concat([
                pd.DataFrame(
                {
                    "kgCO2eq": [train_dist * EF_train['infra']],
                    "EF_tot": [EF_train['infra']],
                    "colors": [color_infra],
                    "NAME": ['Infra'],
                }
                ),
                gdf
            ])
            
            #Add infra
            gdf["Mean of Transport"] = "Train"
            gdf["label"] = "Railway"
            gdf['length'] = str(int(train_dist)) + "km (" + gdf["NAME"] + ")"
            gdf.reset_index(inplace=True)
            
            data_train = gdf[['kgCO2eq', 'colors', 'NAME', 'Mean of Transport']]
            geo_train = gdf[['colors', 'label', 'geometry', 'length']].dropna(axis=0)
            # Returning the result
            return data_train, geo_train, train
    else :
        return pd.DataFrame(), pd.DataFrame(), False

def ecar_to_gdf(
    tag1, tag2, nb=1, validate=val_perimeter, color_usage="#ffffff", color_cons="#ffffff"
):  # charte_mollow
    """
    parameters:
        - tag1, tag2
        - perims
        - validate
        - colormap, list of colors
    return:
        - full dataframe for trains
    """
    ### Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            #gdf, geom_route, route_dist, route = pd.DataFrame(), None, None, False
            return pd.DataFrame(), pd.DataFrame(), False

        else :  # We need to filter by country and add length / Emission factors
            gdf = filter_countries_world(gpd.GeoSeries(
                geom_route, crs="epsg:4326"), method = 'ecar')
            
            # Add colors
            gdf["colors"] =  color_usage

            l_length = []
            # Compute the true distance
            geod = Geod(ellps="WGS84")
            for geom in gdf.geometry.values:
                l_length.append(geod.geometry_length(geom) / 1e3)
            # Add the distance to the dataframe
            gdf["path_length"] = l_length
            #Rescale the length with route_dist (especially when simplified = True)
            print('Rescaling factor', route_dist / gdf["path_length"].sum())
            gdf["path_length"] = gdf["path_length"] * (route_dist / gdf["path_length"].sum())
            #Handle nb passengers
            nb = int(nb)
            # Compute emissions : EF * length
            gdf["EF_tot"] =gdf["EF_tot"] * EF_ecar['fuel'] * (1 + .04 * (nb - 1)) / (1e3 * nb)   # g/kWh * kWh/km
            gdf["kgCO2eq"] = gdf["path_length"] * gdf["EF_tot"]
            # Add infra and construction
            gdf = pd.concat([
                pd.DataFrame(
                {
                    "kgCO2eq": [route_dist * EF_ecar['construction'] / nb],
                    "EF_tot": [EF_ecar['construction']],
                    "colors": [color_cons],
                    "NAME": ['Construction'],
                }
                ),
                gdf
            ])
            name = str(nb)+'p.'
            gdf["Mean of Transport"] = ['eCar ' + name for k in range(gdf.shape[0])]
            gdf['label'] = 'Road'
            gdf['length'] = str(int(route_dist)) + "km (" + gdf["NAME"] + ")"
            gdf['NAME'] = ' '+ gdf['NAME']
            gdf.reset_index(inplace=True)
            #
            data_ecar = gdf[['kgCO2eq', 'colors', 'NAME', 'Mean of Transport']]
            geo_ecar = gdf[['colors', 'label', 'geometry', 'length']].dropna(axis=0)
            # Returning the result
            return data_ecar, geo_ecar, route
    else:
        return pd.DataFrame(), pd.DataFrame(), False


def car_bus_to_gdf(
    tag1, tag2, EF_car=EF_car, EF_bus=EF_bus, validate=val_perimeter, color_usage="#ffffff", color_cons="#ffffff"
):
    """
    ONLY FOR FIRST FORM (optimization)
    parameters:
        - tag1, tag2
        - EF_car, float emission factor for one car by km
        - EF_bus, float emission factor for bus by pkm
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip)
    return:
        - full dataframe for car and bus, geometry only on car
    """
    ### Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    if route:
        #data_car
        data_car =  pd.DataFrame(
                {
                    "kgCO2eq": [route_dist * EF_car['fuel'], route_dist * EF_car['construction']],
                    "EF_tot": [EF_car['fuel'], EF_car['construction']],
                    "path_length" : [route_dist, route_dist],
                    "colors": [color_usage, color_cons],
                    "NAME": ['Fuel', 'Construction'],
                    "Mean of Transport" : ["Car 1p." for k in range(2)]
                }
                )[::-1]
        #geo_car
        geo_car = pd.DataFrame(
            pd.Series(
                {
                    "colors": color_usage,
                    "label": 'Road',
                    "length": str(int(route_dist)) + "km",
                    "geometry": geom_route,
                }
            )
        ).transpose()
        #data_bus
        data_bus =  pd.DataFrame(
                {
                    "kgCO2eq": [route_dist * EF_bus['fuel'], route_dist * EF_bus['construction']],
                    "EF_tot": [EF_bus['fuel'], EF_bus['construction']],
                    "path_length" : [route_dist, route_dist],
                    "colors": [color_usage, color_cons],
                    "NAME": ['Fuel', 'Construction'],
                    "Mean of Transport" : ["Bus" for k in range(2)]
                }
                )[::-1]
    else:
        data_car, geo_car, data_bus = pd.DataFrame(), pd.DataFrame(), pd.DataFrame()
    return data_car, geo_car, data_bus, route


def bus_to_gdf(
    tag1, tag2, EF_bus=EF_bus, validate=val_perimeter, color_usage="#ffffff", color_cons="#ffffff"
):
    """
    parameters:
        - tag1, tag2
        - EF_bus, float emission factor for bus by pkm
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip)
    return:
        - full dataframe for bus
    """
    ### Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    if route:
        #data_bus
        data_bus =  pd.DataFrame(
                {
                    "kgCO2eq": [route_dist * EF_bus['fuel'], route_dist * EF_bus['construction']],
                    "EF_tot": [EF_bus['fuel'], EF_bus['construction']],
                    "path_length" : [route_dist, route_dist],
                    "colors": [color_usage, color_cons],
                    "NAME": ['Fuel', 'Construction'],
                    "Mean of Transport" : ["Bus" for k in range(2)]
                }
                )[::-1]
        #geo_bus
        geo_bus = pd.DataFrame(
            pd.Series(
                {
                    "colors": color_usage,
                    "label": 'Road',
                    "length": str(int(route_dist)) + "km",
                    "geometry": geom_route,
                }
            )
        ).transpose()
        
    else:
        data_bus, geo_bus = pd.DataFrame(), pd.DataFrame()
    return data_bus, geo_bus, route


def car_to_gdf(
    tag1, tag2, EF_car=EF_car, validate=val_perimeter, nb=1, color_usage="#ffffff", color_cons="#ffffff"
):
    """
    parameters:
        - tag1, tag2
        - EF_car, float emission factor for one car by km
        - color, color in hex of path and bar chart
        - validate
        - nb, number of passenger in the car (used only for custom trip)
    return:
        - full dataframe for car
    """
    ### Route OSRM - create a separate function
    geom_route, route_dist, route = find_route(tag1, tag2)
    if nb != "👍" :
        nb = int(nb)
        EF_fuel = EF_car['fuel'] * (1 + .04 * (nb - 1)) / nb
        EF_cons = EF_car['construction'] / nb
        # EF_infra = EF_car['infra'] /nb
        name = str(nb)+'p.'
    else : #Hitch-hiking
        EF_fuel = EF_car['fuel'] * .04
        EF_cons, EF_infra = 0, 0
        name = "👍"#'HH'

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    if route:
        #data car
        data_car =  pd.DataFrame(
                {
                    "kgCO2eq": [route_dist * EF_fuel, route_dist * EF_cons],
                    "EF_tot": [EF_fuel, EF_cons],
                    "path_length" : [route_dist, route_dist],
                    "colors": [color_usage, color_cons],
                    "NAME": ['Fuel', 'Construction'],
                    "Mean of Transport" : ["Car " + name for k in range(2)]
                }
                )[::-1]
        #geo_car
        geo_car = pd.DataFrame(
            pd.Series(
                {
                    "colors": color_usage,
                    "label": 'Road',
                    "length": str(int(route_dist)) + "km",
                    "geometry": geom_route,
                }
            )
        ).transpose()

    else:
        data_car, geo_car = pd.DataFrame(), pd.DataFrame()

    # Return the result
    return data_car, geo_car, route



def plane_to_gdf(
    tag1,
    tag2,
    EF_plane=EF_plane,
    contrails=cont_coeff,
    holding=hold,
    detour=detour,
    color_usage="#ffffff", color_cont="#ffffff"
):
    """
    parameters:
        - tag1, tag2
        - EF : emission factor in gCO2/pkm for plane depending on journey length
        - contrails : coefficient to apply to take into account non-CO2 effects
        - holding : additional CO2 emissions (kg) due to holding patterns
        - color : color for path and bar chart
        - color_contrails : color for non CO2-effects in bar chart
    return:
        - full dataframe for plane, geometry for CO2 only (optimization)
    """
    # Compute geometry and distance (geodesic)
    geom_plane, bird = great_circle_geometry(tag1, tag2)

    # Different emission factors depending on the trip length
    if bird < 1000:
        trip_category = 'short'
    elif bird < 3500:
        trip_category = 'medium'
    else:  # It's > 3500
        trip_category = 'long'
    #detour_coeffient
    bird = bird * detour
    
    data_plane = pd.DataFrame(
    {
        "kgCO2eq": [bird * np.sum(list(EF_plane[trip_category].values())[1:3]) + holding, 
                    bird * EF_plane[trip_category]['combustion'] * contrails
                    ],
        "EF_tot": [
                    np.sum(list(EF_plane[trip_category].values())[1:3]), 
                    EF_plane[trip_category]['combustion'] * contrails
            ],
        "colors": [color_usage, color_cont],
        "NAME": ['Kerosene', 'Contrails'],
        "Mean of Transport": ["Plane", "Plane"],
    }
)
    #Geo plane
    geo_plane = pd.DataFrame(
        pd.Series(
            {
                "colors": color_usage,
                "label": "Flight",
                "length": str(int(bird)) + "km",
                "geometry": geom_plane,
            }
        )
    ).transpose()
    return data_plane, geo_plane


def ferry_to_gdf(tag1, tag2, EF=EF_ferry, options = "None" , color_usage="#ffffff"):
    """
    parameters:
        - tag1, tag2
        - EF : emission factor in gCO2/pkm for ferry
        - color : color for path and bar chart
    return:
        - full dataframe for ferry
    """
    # Compute geometry
    #Convert the inputs in float
    start = tuple([float(x) for x in tag1])
    end = tuple([float(x) for x in tag2])
    # Here new function
    geom = get_shortest_path(gdf_lines(start, end), start, end)
    #geom = LineString([tag1, tag2])
    # Compute the true distance
    geod = Geod(ellps="WGS84")
    bird = geod.geometry_length(geom) / 1e3
    #Compute the good emission factor
    if options == "None":
        EF = EF['Seat'] + EF['Base']
    elif options == "Cabin":
        EF = EF['Cabin'] + EF['Base']
    elif options == "Vehicle":
        EF = EF['Car'] + EF['Seat'] + EF['Base']
    elif options == "CabinVehicle":
        EF = EF['Car'] + EF['Cabin'] + EF['Base']
    
    # Compute geodataframe and dataframe
    # data 
    data_ferry = pd.DataFrame(
        pd.Series(
            {
                "kgCO2eq": EF * bird,
                "EF_tot": EF,
                "path_length": bird,
                "colors": color_usage,
                "NAME": options,
                "Mean of Transport": "Ferry",
            }
        )
    ).transpose()
    geo_ferry = pd.DataFrame(
        pd.Series(
            {
                "colors": color_usage,
                "label" : "Ferry",
                "length": str(int(bird)) + "km",
                "geometry": geom,
            }
        )
    ).transpose()

    return data_ferry, geo_ferry


def sail_to_gdf(tag1, tag2, EF=EF_sail, color_usage="#ffffff"):
    """
    parameters:
        - tag1, tag2
        - EF : emission factor in gCO2/pkm for ferry
        - color : color for path and bar chart
    return:
        - full dataframe for ferry
    """
    # Compute geometry
    #Convert the inputs in float
    start = tuple([float(x) for x in tag1])
    end = tuple([float(x) for x in tag2])
    # Here new function
    geom = get_shortest_path(gdf_lines(start, end), start, end)
    #geom = LineString([tag1, tag2])
    # Compute the true distance
    geod = Geod(ellps="WGS84")
    bird = geod.geometry_length(geom) / 1e3
    # Compute geodataframe and dataframe
    # data 
    data_ferry = pd.DataFrame(
        pd.Series(
            {
                "kgCO2eq": EF * bird,
                "EF_tot": EF,
                "path_length": bird,
                "colors": color_usage,
                "NAME": "Usage",
                "Mean of Transport": "Sail",
            }
        )
    ).transpose()
    geo_ferry = pd.DataFrame(
        pd.Series(
            {
                "colors": color_usage,
                "label" : "Sail",
                "length": str(int(bird)) + "km",
                "geometry": geom,
            }
        )
    ).transpose()

    return data_ferry, geo_ferry