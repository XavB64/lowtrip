
from parameters import(
    EF_bycicle, 
    EF_bus,
    EF_car,
    EF_ecar,
    EF_ferry,
    EF_plane,
    EF_rail_infra,
    search_perimeter,
    val_perimeter, 
    charte_mollow,
    hold,
    cont_coeff,
    detour,
    colors_transport
)

from utils import(
    validate_geom,
    extend_search,
    filter_countries_world,
    great_circle_geometry,
    find_bicycle,
    find_route,
    find_train
)


import pandas as pd
import numpy as np
from pyproj import Geod
from shapely.geometry import LineString
import geopandas as gpd

def bicycle_to_gdf(
    tag1, tag2, EF=EF_bycicle, color="#00FF00", validate=val_perimeter
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
    geom_route, route, route_dist = find_bicycle(tag1, tag2)

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route, route_dist = None, False, None

    if route:
        gdf_bike = pd.DataFrame(
            pd.Series(
                {
                    "kgCO2eq": EF * route_dist,
                    "EF_tot": EF,
                    "path_length": None,
                    "colors": color,
                    "NAME": " ",
                    "Mean of Transport": "Bicycle",
                    "geometry": geom_route,
                }
            )
        ).transpose()  #'EF_tot':EF_bus, enlever geometry
    else:
        gdf_bike = pd.DataFrame()
    return gdf_bike, route





def train_to_gdf(
    tag1, tag2, perims=search_perimeter, EF_infra = EF_rail_infra, validate=val_perimeter, colormap=charte_mollow
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
            return pd.DataFrame(), False

        else :  # We need to filter by country and add length / Emission factors
            gdf = filter_countries_world(gdf, method = 'train')
            # Add colors, here discretise the colormap
            gdf["colors"] = colormap
            # gdf['colors'] = ['#'+k for k in pd.Series(colormap[::-1])[[int(k) for k in np.linspace(0, len(colormap)-1, gdf.shape[0])]]]
            # Adding and computing emissions
            # For trains
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
            gdf["kgCO2eq"] = gdf["path_length"] * (gdf["EF_tot"] + EF_infra)
            
            #Add infra
            gdf["Mean of Transport"] = "Train"
            # Returning the result
            return gdf, train
    else :
        return pd.DataFrame(), False

def ecar_to_gdf(
    tag1, tag2, nb=1, validate=val_perimeter, color="#00FF00"
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
            return pd.DataFrame(), False

        else :  # We need to filter by country and add length / Emission factors
            gdf = filter_countries_world(gpd.GeoSeries(
                geom_route, crs="epsg:4326"), method = 'ecar')
            
            # Add colors, here discretise the colormap
            gdf["colors"] = color
            # gdf['colors'] = ['#'+k for k in pd.Series(colormap[::-1])[[int(k) for k in np.linspace(0, len(colormap)-1, gdf.shape[0])]]]
            # Adding and computing emissions
            # For trains
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
            gdf['NAME'] = ' '+ str(nb)+'pass. '+gdf['NAME']
            # Compute emissions : EF * length
            gdf["EF_tot"] =(gdf["EF_tot"] * EF_ecar['fuel'] * (1 + .04 * (nb - 1)) / (1e3 * nb))  + ((EF_ecar['construction'] + EF_ecar['infra']) / nb) # g/kWh * kWh/km
            gdf["kgCO2eq"] = gdf["path_length"] * gdf["EF_tot"]
            gdf["Mean of Transport"] = "eCar"
            # Returning the result
            return gdf, route
    else:
        return pd.DataFrame(), False


def car_bus_to_gdf(
    tag1, tag2, EF_car=EF_car, EF_bus=EF_bus, color="#00FF00", validate=val_perimeter
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
        gdf_car = pd.DataFrame(
            pd.Series(
                {
                    "kgCO2eq": route_dist * np.sum(list(EF_car.values())),
                    "EF_tot": np.sum(list(EF_car.values())),
                    "path_length": route_dist,
                    "colors": color,
                    "NAME": "1 pass.", #Préciser 1 passager ici pour le moment ?
                    "Mean of Transport": "Car",
                    "geometry": geom_route,
                }
            )
        ).transpose()  #'EF_tot':EF_car / nb,
        gdf_bus = pd.DataFrame(
            pd.Series(
                {
                    "kgCO2eq": route_dist * np.sum(list(EF_bus.values())),
                    "EF_tot": np.sum(list(EF_bus.values())),
                    "path_length": route_dist,
                    "colors": color,
                    "NAME": "Bus",
                    "Mean of Transport": "Bus",
                }
            )
        ).transpose()  #'EF_tot':EF_bus, enlever geometry
    else:
        gdf_car, gdf_bus = pd.DataFrame(), pd.DataFrame()
    return gdf_car, gdf_bus, route


def bus_to_gdf(
    tag1, tag2, EF_bus=EF_bus, color="#00FF00", validate=val_perimeter, nb=1
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
        gdf_bus = pd.DataFrame(
            pd.Series(
                {
                    "kgCO2eq": route_dist * np.sum(list(EF_bus.values())),
                    "EF_tot": np.sum(list(EF_bus.values())),
                    "path_length": route_dist,
                    "colors": color,
                    "NAME": " ",
                    "Mean of Transport": "Bus",
                    "geometry": geom_route,
                }
            )
        ).transpose()  #'EF_tot':EF_bus, enlever geometry
    else:
        gdf_bus = pd.DataFrame()
    return gdf_bus, route


def car_to_gdf(
    tag1, tag2, EF_car=EF_car, color=colors_transport['Road'], validate=val_perimeter, nb=1
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
        EF_fuel = EF_car['fuel'] * (1 + .04 * (nb - 1))
        EF = (np.sum(list(EF_car.values())) / nb) + EF_car['fuel'] * .04 * (nb - 1) #Over consumption due to weight and luggages
        name = str(nb)+'pass.'
    else : #Hitch-hiking
        EF_fuel = EF_car['fuel'] * .04
        name = 'Hitch-hiking'

    # Validation part for route
    if route:  # We have a geometry
        if not validate_geom(tag1, tag2, geom_route, validate):
            geom_route, route_dist, route = None, None, False

    if route:
        gdf_car = pd.DataFrame(
            pd.Series(
                {
                    # "kgCO2eq": [route_dist * EF_fuel, route_dist * EF['construction'], route_dist * EF['Infra']]
                    # "EF_tot": EF, #Adding consumption with more weight
                    "path_length": route_dist,
                    "colors": color[0],
                    "Mean of Transport": "Road",
                    "geometry": geom_route,
                }
            )
        ).transpose()
        data_car = pd.DataFrame(
                {
                    "kgCO2eq": [route_dist * EF_fuel, route_dist * EF_car['construction'], route_dist * EF_car['infra']],
                    "EF_tot": [EF_fuel, EF_car['construction'], EF_car['infra']],
                    "colors": color,
                    "NAME": ['Usage', 'Construction', 'Infra'],
                    "Mean of Transport": ["Car", "Car", "Car"],
                }
            )
         #'EF_tot':EF_car / nb,
        data_car.to_csv('just_to_see.csv')
    else:
        gdf_car, data_car = pd.DataFrame(), pd.DataFrame()

    # Return the result
    return gdf_car, data_car, route



def plane_to_gdf(
    tag1,
    tag2,
    EF_plane=EF_plane,
    contrails=cont_coeff,
    holding=hold,
    detour=detour,
    color="#00008B",
    color_contrails="#00004B",
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
    # We sum the different contribution for CO2 only
    EF = np.sum(list(EF_plane[trip_category].values()))
    # Compute geodataframe and dataframe
    gdf_plane = pd.DataFrame(
        pd.Series(
            {
                "kgCO2eq": EF * bird + holding,
                "EF_tot": EF,
                "path_length": bird,
                "colors": color,
                "NAME": "CO2",
                "Mean of Transport": "Plane",
                "geometry": geom_plane,
            }
        )
    ).transpose()
    # Non CO2 contribution are determined from the combustion of fuel only
    gdf_non_co2 = pd.DataFrame(
        pd.Series(
            {
                "kgCO2eq": EF_plane[trip_category]['combustion'] * contrails * bird,
                "colors": color_contrails,
                "NAME": "Contrails & NOx",
                "Mean of Transport": "Plane",
            }
        )
    ).transpose()
    return gdf_plane, gdf_non_co2


def ferry_to_gdf(tag1, tag2, EF=EF_ferry, color="#FF0000"):
    """
    parameters:
        - tag1, tag2
        - EF : emission factor in gCO2/pkm for ferry
        - color : color for path and bar chart
    return:
        - full dataframe for ferry
    """
    # Compute geometry
    geom = LineString([tag1, tag2])
    # Compute the true distance
    geod = Geod(ellps="WGS84")
    bird = geod.geometry_length(geom) / 1e3
    # Compute geodataframe and dataframe
    gdf_ferry = pd.DataFrame(
        pd.Series(
            {
                "kgCO2eq": EF * bird,
                "EF_tot": EF,
                "path_length": bird,
                "colors": color,
                "NAME": " ",
                "Mean of Transport": "Ferry",
                "geometry": geom,
            }
        )
    ).transpose()
    # gdf_ferry.geometry = gdf_ferry.geometry.astype('geometry')

    return gdf_ferry


