#####################
### Librairies ######
#####################


# Classic
import geopandas as gpd
import pandas as pd


# Geometry
from shapely.geometry import LineString
from pyproj import Geod

from parameters import(
    colors_custom,
    colors_alternative,
    min_plane_dist,
    colors_direct,
)

from transport import(
    train_to_gdf,
    plane_to_gdf,
    car_bus_to_gdf,
    car_to_gdf,
    ecar_to_gdf,
    bus_to_gdf,
    bicycle_to_gdf,
    ferry_to_gdf
)



######################
#### Functions #######
######################




def compute_emissions_custom(data, 
                             #cmap=colors_custom
                             ):
    """
    parameters:
        - data, pandas dataframe format (will be json)
    return:
        - full dataframe for emissions
        - geodataframe for path
        - ERROR : string first step that fails
    """
    ERROR = ''
    #Ajouter une variable mean/other pour faire un message d'erreur personnalisé ?
    # Colors
    # Custom trip
    #list_items = ["Train", "Bus", "Car", "Plane_contrails", "Plane", "Ferry"]
    #color_custom = dict(zip(list_items, cmap))
    
    l = []
    geo = []
    fail = False # To check if the query is successfull
    for idx in data.index[:-1]:  # We loop until last departure
        # Departure coordinates
        depature = data.loc[idx]
        departure_coordinates = (depature.lon, depature.lat)

        # Arrival coordinates
        arrival = data.loc[str(int(idx) + 1)]
        arrival_coordinates = (arrival.lon, arrival.lat)

        # Mean of transport
        transport_mean = arrival.transp

        # Compute depending on the mean of transport
        if transport_mean == "Train":
            data_train, geo_train, _train = train_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                #colormap=color_custom["Train"],
            )
            if not _train : #One step is not succesful
                fail = True
                ERROR = 'step n°'+str(int(idx) + 1)+' failed with Train, please change mean of transport or locations. '
                break
            # Adding a step variable here to know which trip is it
            data_train["step"] = str(int(idx) + 1)
            l.append(data_train)
            #gdf['Mean of Transport'] = 'Railway'
            geo.append(geo_train)

        elif transport_mean == "Bus":
            data_bus, geo_bus, _bus = bus_to_gdf(
                departure_coordinates, arrival_coordinates, 
                #color=color_custom["Bus"]
            )
            if not _bus : #One step is not succesful
                fail = True
                ERROR = 'step n°'+str(int(idx) + 1)+' failed with Bus, please change mean of transport or locations. '
                break
            data_bus["step"] = str(int(idx) + 1)
            l.append(data_bus)
            #gdf_bus['Mean of Transport'] = 'Road'
            geo.append(geo_bus)

        elif transport_mean == "Car":
            # We get the number of passenger
            data_car, geo_car, _car = car_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                nb=arrival.nb,
                #color=color_custom["Car"],
            )
            if not _car : #One step is not succesful
                fail = True
                ERROR = 'step n°'+str(int(idx) + 1)+' failed with Car, please change mean of transport or locations. '
                break
            data_car["step"] = str(int(idx) + 1)
            l.append(data_car) #gdf_car.copy()
            #gdf_car['Mean of Transport'] = 'Road'
            geo.append(geo_car)
            
        elif transport_mean == "eCar":
            data_ecar, geo_ecar, _car = ecar_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                nb=arrival.nb,
                #color=color_custom["Car"],
            )
            if not _car : #One step is not succesful
                fail = True
                ERROR = 'step n°'+str(int(idx) + 1)+' failed with eCar, please change mean of transport or locations. '
                break
            data_ecar["step"] = str(int(idx) + 1)
            l.append(data_ecar)
            #gdf_car['Mean of Transport'] = 'Road'
            geo.append(geo_ecar)
            
        elif transport_mean == "Bicycle":
            # We get the number of passenger
            data_bike, geo_bike, _bike = bicycle_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                #color=color_custom["Train"],
            )
            if not _bike : #One step is not succesful
                fail = True
                ERROR = 'step n°'+str(int(idx) + 1)+' failed with Bicycle, please change mean of transport or locations. '
                break
            data_bike["step"] = str(int(idx) + 1)
            l.append(data_bike)
            #geo_bike['Mean of Transport'] = 'Bike route'
            geo.append(geo_bike)

        elif transport_mean == "Plane":
            data_plane, geo_plane = plane_to_gdf(
                departure_coordinates,
                arrival_coordinates,
                # color=color_custom["Plane"],
                # color_contrails=color_custom["Plane_contrails"],
            )
            data_plane["step"] = str(int(idx) + 1)
            #gdf_cont["step"] = str(int(idx) + 1)
            #l.append(gdf_plane.copy())
            l.append(data_plane)
            #gdf_plane['Mean of Transport'] = 'Flight path'
            geo.append(geo_plane)

        elif transport_mean == "Ferry":
            data_ferry, geo_ferry = ferry_to_gdf(
                departure_coordinates, arrival_coordinates, 
                #color=color_custom["Ferry"]
            )
            data_ferry["step"] = str(int(idx) + 1)
            l.append(data_ferry)
            geo.append(geo_ferry)
            
    if fail :
        #One or more step weren't succesful, we return nothing
        data_custom = pd.DataFrame()
        geodata = pd.DataFrame()
    else :
        # Query successfull, we concatenate the data
        data_custom = pd.concat(l)
        data_custom = data_custom.reset_index(drop=True)#.drop("geometry", axis=1)
        # Geodataframe for map
        geodata = gpd.GeoDataFrame(pd.concat(geo), geometry="geometry", crs="epsg:4326")

    return data_custom, geodata, ERROR


def compute_emissions_all(data, 
                          #cmap=colors_direct
                          ):
    """
    If data is only one step then we do not compute this mean of transport as it will
    appear in "my_trip"
    parameters:
        - data, pandas dataframe format (will be json)
    return:
        - full dataframe for emissions
        - geodataframe for path
    """
    # colors
    # Direct trip
    #list_items = ["Train", "Car&Bus", "Plane_contrails", "Plane"]
    #color_direct = dict(zip(list_items, cmap))
    # Departure coordinates
    lon = data.loc["0"].lon
    lat = data.loc["0"].lat
    tag1 = (lon, lat)
    # Arrival coordinates
    lon = data.loc[str(data.shape[0] - 1)].lon
    lat = data.loc[str(data.shape[0] - 1)].lat
    tag2 = (lon, lat)

    # Check if we should compute it or not
    train, plane, car, bus = True, True, True, True

    # Retrieve the mean of transport: Car/Bus/Train/Plane
    transp = data.loc["1"].transp
    if transp == "Train":
        train = False
    elif transp == "Plane":
        plane = False
    elif transp == "Car":
        car = False
    elif transp == "Bus":
        bus = False
    
    #Check distance for plane
    geod = Geod(ellps = 'WGS84')
    if geod.geometry_length(LineString([tag1, tag2])) / 1e3 < min_plane_dist :
        #Then we do not suggest the plane solution
        plane = False
    # Loop
    l = []
    geo = []

    # Train
    if train:
        data_train, geo_train, train = train_to_gdf(tag1, tag2, 
                                                    #colormap=color_direct["Train"]
                                                    )
        l.append(data_train)
        geo.append(geo_train)

    # Car & Bus
    data_car, geo_car, data_bus, route = car_bus_to_gdf(tag1, tag2, 
                                                        #color=color_direct["Car&Bus"]
                                                        )
    # To avoid errors in the bar chart, I don't know why the change of name propagates
    #geo_car = gdf_car.copy()
    if bus:
        l.append(data_bus)
        #We change it
        #gdf_car['Mean of Transport'] = 'Bus'
    if car:
        l.append(data_car)
    #If we have a result for car and bus :
    if route: # Adapt and add ecar
        #We check if car or bus was asked for a 1 step
        if  (car==True) & (bus==True) & (transp!='eCar'):
            #gdf_car['Mean of Transport'] = 'Road'
            geo.append(geo_car)

    # Plane
    if plane:
        data_plane, geo_plane = plane_to_gdf(
            tag1,
            tag2,
            # color=color_direct["Plane"],
            # color_contrails=color_direct["Plane_contrails"],
        )
       # l.append(gdf_plane.copy())
        l.append(data_plane)
       # gdf_plane['Mean of Transport'] = 'Flight path'
        geo.append(geo_plane)

    # We do not add the ferry in the general case

    if (route == False) & (train == False) & (plane == False):
        # Only happens when plane was asked and the API failed
        data, geodata = pd.DataFrame(), pd.DataFrame()
    else:
        # Data for bar chart
        data = pd.concat(l).reset_index(drop=True)
    #     [['kgCO2eq',  'colors', 'NAME',
    #    'Mean of Transport']]
        # Geodataframe for map
        geodata = gpd.GeoDataFrame(pd.concat(geo), geometry="geometry", crs="epsg:4326")

    return data, geodata


def chart_refactor(mytrip, alternative=None, do_alt=False):
    """
    This function prepare the data to be displayed in the chart correctly
    parameters:
        - mytrip, dataframe of custom trip
        - alternative, dataframe of alternative trip if requested
        - do_alt (bool), is there an alternative trip ?
    return:
        - data with changed fields for bar chart
    """
    #Check if my trip worked
    if mytrip.shape[0] > 0:
        # Merging means of transport for custom trips
        mytrip["NAME"] = (
            mytrip["step"] 
            + ". " 
            + mytrip["Mean of Transport"] 
            + " - " 
            + mytrip["NAME"]
        )  # + ' - ' + mytrip.index.map(str) + '\''
        # Separtating bars
        mytrip["Mean of Transport"] = "My trip"
        #mytrip = mytrip[l_var]

    if do_alt:
        #Check if it worked
        if alternative.shape[0] > 0 :
            # We have to render alternative as well
            alternative["NAME"] = (
                alternative["step"]
                + ". "
                + alternative["Mean of Transport"]
                + " - "
                + alternative["NAME"]
                + " "
            )  # + ' - ' + alternative.index.map(str)
            alternative["Mean of Transport"] = "Other trip"
            # Then we return both
            
            return mytrip, alternative#[l_var]
        #If it didnt work we return it (empty)
        
        else :
            return mytrip, alternative
        
    #If it didnt work we return it (empty)
    else:
        return mytrip
