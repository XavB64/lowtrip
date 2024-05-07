export const thumbUp = "👍";

export interface Step {
  index: number;
  id: string;
  locationName?: string;
  locationCoords?: [number, number];
  transportMean?: Transport;
  passengers?: number | typeof thumbUp;
  options?: FerryOptions;
}

export interface StepProps {
  values: Step[];
  addStep: () => void;
  removeStep: (index: number) => void;
  updateStep: (index: number, data: Partial<Step>) => void;
}

export enum Transport {
  plane = "Plane",
  car = "Car",
  ecar = "eCar",
  bus = "Bus",
  train = "Train",
  ferry = "Ferry",
  bicycle = "Bicycle",
  sail = "Sail",
  myTrip = "MyTrip",
  otherTrip = "OtherTrip",
}

export enum FerryOptions {
  none = "None",
  cabin = "Cabin",
  vehicle = "Vehicle",
  cabinVehicle = "CabinVehicle",
}

export interface ApiResponse {
  data: {
    gdf: string;
    my_trip: string;
    direct_trip?: string;
    alternative_trip?: string;
    error: string;
  };
}

export interface Gdf {
  type: string;
  features: {
    id: string;
    type: string;
    properties: { colors: string; label: string; length: string };
    geometry: { type: string; coordinates: [number, number][] };
  }[];
}

export interface TripData {
  ISO2: string;
  NAME: string;
  EF_tot: number;
  colors: string;
  path_length: number;
  kgCO2eq: number;
  "Mean of Transport": Transport;
  Type: string;
}

export enum EmissionsCategory {
  infra = "Infra",
  construction = "Construction",
  fuel = "Fuel",
  kerosene = "Kerosene",
  contrails = "Contrails",
  bikeBuild = "Bike-build",
}
