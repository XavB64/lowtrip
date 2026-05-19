######################
## Global variables ##
######################

import geopandas as gpd


# Load world datasets
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


##########
## Plane##
##########


# Min distance for plane comparison
min_plane_dist = 300  # km
