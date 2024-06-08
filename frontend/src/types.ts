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

export type MyTripData = {
  NAME: string;
  colors: string;
  kgCO2eq: number;
  "Mean of Transport": Transport;
  step: number;
};

export interface DirectTripData {
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
  none = "None",
  cabin = "Cabin",
  vehicle = "Vehicle",
  cabinvehicle = "CabinVehicle",
}

export type Trip = {
  steps: TripStep[];
  label: string;
  totalEmissions: number;
  isMainTrip?: boolean;
};

export type TripStep = {
  emissions: number;
} & (
  | {
      transportMeans: Transport.plane;
      emissionParts: {
        emissionSource:
          | EmissionsCategory.contrails
          | EmissionsCategory.kerosene;
        color: string;
        emissions: number;
      }[];
    }
  | {
      transportMeans: Transport.bus | Transport.car | Transport.ecar;
      emissionParts: {
        emissionSource: EmissionsCategory.construction | EmissionsCategory.fuel;
        color: string;
        emissions: number;
        passengerNb?: number;
      }[];
    }
  | {
      transportMeans: Transport.train;
      emissionParts: {
        emissionSource: EmissionsCategory.infra | EmissionsCategory.none;
        color: string;
        emissions: number;
      }[];
    }
);

export type Geometry = {
  label: string;
  length: string;
  color: string;
  coordinates: [number, number][];
};

export enum SimulationType {
  mainTripVsOtherTransportMeans = "mainTripVsOtherTransportMeans",
  mainTripVsOtherTrip = "mainTripVsOtherTrip",
  mainTripOnly = "mainTripOnly",
}

export type SimulationResults = {
  trips: Trip[];
  tripGeometries: Geometry[];
  simulationType: SimulationType;
  error?: string;
};
