######################
## Global variables ##
######################

import geopandas as gpd


# Load  world datasets
train_intensity = gpd.read_file("static/train_intensity.geojson")
carbon_intensity_electricity = gpd.read_file(
    "static/carbon_intensity_electricity.geojson",
)

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

EF_bicycle = 0.005

EF_ferry = {
    "Cabin": 0.11,
    "Seat": 0.008,
    "Base": 0.08,
    "Car": 0.114,
}

EF_sail = 0.069

##########
## Plane##
##########


# Min distance for plane comparison
min_plane_dist = 300  # km
