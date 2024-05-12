######################
## Global variables ##
######################

import geopandas as gpd


# Load  world datasets
train_intensity = gpd.read_file("static/train_intensity.geojson")
carbon_intensity_electricity = gpd.read_file(
    "static/carbon_intensity_electricity.geojson"
)


####################
#### COLORS ########
####################

# Select main colors
l_colors_custom = [
    # "#bfeef3"
    "#b3eef5",
    "#7de4f0",
    "#4accdb",
    "#148693",
    "#27A4B2",
    "#148693",
    "#006773",
]

l_colors_direct = [
    "#febc78",
    "#E69138",
    "#B45E06",
    "#cd781f",
    "#B45E06",
]

l_colors_alternative = [
    # "#ffdfe4",
    "#ffd1d9",
    "#f9b5c1",
    "#f299a9",
    "#e5617a",
    "#ec7d92",
    "#e5617a",
    "#df4562",
]

list_items = ["Bicycle", "Train", "Road", "Cons_infra", "Contrails", "Plane", "Ferry"]
colors_custom = dict(zip(list_items, l_colors_custom))
l_direct = ["Train", "Road", "Cons_infra", "Contrails", "Plane"]
colors_direct = dict(zip(l_direct, l_colors_direct))
colors_alternative = dict(zip(list_items, l_colors_alternative))

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
    "construction": 0.0256,
    "fuel": 0.192,  # total : .2176
    "infra": 0.0007,
}
EF_ecar = {
    "construction": 0.0836,
    "fuel": 0.187,  # kWh / km
    "infra": 0.0007,
}
EF_bus = {
    "construction": 0.00442,
    "fuel": 0.025,  # total .02942
    "infra": 0.0007,
}

EF_train = {
    "construction": 0.0006,
    "infra": 0.0065,
}

EF_bycicle = 0.005

EF_ferry = {
    "Cabin": 0.11,
    "Seat": 0.008,
    "Base": 0.08,
    "Car": 0.114,
}

EF_sail = 0.069

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

##########
## Plane##
##########

# Number of points in plane geometry
nb_pts = 100
# Min distance for plane comparison
min_plane_dist = 300  # km

# Additional emissions from plane
cont_coeff = 2
hold = 3.81  # kg/p
detour = 1.076
