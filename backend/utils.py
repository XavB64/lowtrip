import numpy as np

def extract_coordinates(line):
    return [[point[0], point[1]] for point in line.coords]

def create_geometry_object(row):
    return {'coordinates': row['coordinates'], 'color': row['colors']}

def convert_gdf_to_geometries(gdf):
    gdf['coordinates'] = gdf['geometry'].apply(extract_coordinates)

    geometries = gdf.apply(create_geometry_object, axis=1)

    return list(geometries)


def create_train_step(row):
    return {'name': row['NAME'], 'emissions': row['kgCO2eq']}

def convert_gdf_to_train_trip(gdf):
    gdf['coordinates'] = gdf['geometry'].apply(extract_coordinates)

    geometry = np.concatenate(gdf['coordinates']).tolist()

    train_trip_steps = list(gdf.apply(create_train_step, axis=1))
    return geometry, list(train_trip_steps)
