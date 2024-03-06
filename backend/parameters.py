
######################
## Global variables ##
######################

import geopandas as gpd
# Load  world datasets
world = gpd.read_file("static/world.geojson")
carbon_intensity_electricity = gpd.read_file('static/carbon_intensity_electricity.geojson')



colors_transport = {
    'Train' : ['#CCFCCB', '#96E6B3', '#568259'],
    'Plane' : ['#004BA8', '#4A525A', '#24272B', '#3E78B2'],
    'Road' : [ '#280000', '#570000', '#B10F2E'],
    'Bicycle' : ['#F1FFFA'],
    'Ferry' : ['#55868C']	
}


# Fields to return for bar chart
l_var = ["NAME", "Mean of Transport", "kgCO2eq", "colors"]

# Colors
charte_mollow = [
    "590D22",
    "800F2F",
    "A4133C",
    "C9184A",
    "FF4D6D",
    "FF758F",
    "FF8FA3",
    "FFB3C1",
    "FFCCD5",
    "FFD6DD",
]

# Select main colors
colors_custom = [
    "#b3eef5",
    "#7de4f0",
    "#4accdb",
    "#27A4B2",
    "#148693",
    "#006773"
]
colors_direct = [
    "#febc78",
    "#E69138",
    "#cd781f",
    "#B45E06",
]
colors_alternative = [
    "#ffd1d9",
    "#f9b5c1",
    "#f299a9",
    "#ec7d92",
    "#e5617a",
    "#df4562"
]

# Geometries from API
simplified = True
if simplified:
    train_s, train_t, route_s = "simplified", "1", "simplified" 
else:
    train_s, train_t, route_s = "full", "0", "full" 

# Validation perimeter
val_perimeter = 100  # km

# Search areas
search_perimeter = [0.2, 5]  # km

# Threshold for unmatched train geometries (sea)
sea_threshold = 5  # km

# Emission factors kg/pkm
EF_car = {
    'construction' : .0256, 
    'fuel' : .192, # total : .2176
    'infra' : .0007
} 
EF_ecar = {
    'construction' : 0.0836,
    'fuel' : 0.187, #kWh / km
    'infra' : .0007 
}
EF_bus = {
    'construction' : 0.00442,
    'fuel' : 0.025, #total .02942
    'infra' : .0007
} 

EF_rail_infra = .0065

EF_bycicle = .005

EF_ferry = .3

EF_plane = {
    "short": {
        'construction' : .00038,
        'upstream' : .0242,
        'combustion' : .117,
         "infra":.0003
},
    "medium": {
        'construction' : .00036,
        'upstream' : .0176,
        'combustion' : .0848,
         "infra":.0003
},
    "long": {
        'construction' : .00026,
        'upstream' : .0143,
        'combustion' : .0687,
         "infra":.0003
}
            }

# Number of points in plane geometry
nb_pts = 100
# Min distance for plane comparison
min_plane_dist = 300 #km

# Additional emissions from plane
cont_coeff = 2
hold = 3.81  # kg/p
detour = 1.076