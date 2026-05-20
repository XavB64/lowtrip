######################
## Global variables ##
######################

import geopandas as gpd
from pyproj import Geod


GEOD = Geod(ellps="WGS84")


# Sources:
# - European countries: ADEME Base Carbone (2024)
# - China, Japan, USA, India & Russia: Railway Handbook produced by the International
#   and Environmental Agency and the Union of Railways (2017, https://uic.org/IMG/pdf/handbook_iea-uic_2017_web3.pdf)
# - other countries: 100gCO2 /p.km by default
train_intensity = gpd.read_file("static/train_intensity.geojson")

# Source: Our World in Data (2024) - https://ourworldindata.org/electricity-mix
carbon_intensity_electricity = gpd.read_file(
    "static/carbon_intensity_electricity.geojson",
)

# Minimun distance for plane comparison
PLANE_MIN_DISTANCE = 300  # km
