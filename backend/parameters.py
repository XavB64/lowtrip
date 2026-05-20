######################
## Global variables ##
######################

import geopandas as gpd
from pyproj import Geod


GEOD = Geod(ellps="WGS84")


# Load world datasets
train_intensity = gpd.read_file("static/train_intensity.geojson")
carbon_intensity_electricity = gpd.read_file(
    "static/carbon_intensity_electricity.geojson",
)

# Minimun distance for plane comparison
PLANE_MIN_DISTANCE = 300  # km
