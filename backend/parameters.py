######################
## Global variables ##
######################

import geopandas as gpd


# Load world datasets
train_intensity = gpd.read_file("static/train_intensity.geojson")
carbon_intensity_electricity = gpd.read_file(
    "static/carbon_intensity_electricity.geojson",
)


##########
## Plane##
##########


# Min distance for plane comparison
min_plane_dist = 300  # km
