export const thumbUp = "👍";

export enum TRIP_TYPE {
  MAIN = "main",
  ALTERNATIVE = "alternative",
}

export type Step = {
  index: number;
  id: string;
  locationName?: string;
  locationCoords?: [number, number];
  transportMean?: Transport;
  passengers?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | typeof thumbUp;
  options?: FerryOptions;
};

export enum Transport {
  plane = "plane",
  car = "car",
  ecar = "ecar",
  bus = "bus",
  train = "train",
  ferry = "ferry",
  bicycle = "bicycle",
  sail = "sail",
  myTrip = "myTrip",
  otherTrip = "otherTrip",
}

export enum FerryOptions {
  none = "none",
  cabin = "cabin",
  vehicle = "vehicle",
  cabinVehicle = "cabinVehicle",
}

type TripStepGeometry = {
  color: string;
  coordinates: [number, number][][];
  transport_means: string;
  length: number;
  country_label: string | null;
};

type TripResult = {
  name: string;
  steps: ({
    transport: string;
    path_length: number;
    emissions: {
      name: string;
      ef_tot: number;
      kg_co2_eq: number;
      color: string;
    }[];
  } & (
    | {
        transport: Transport.bicycle;
        coeff_upstream: number;
      }
    | {
        transport: Transport.bus;
        coeff_upstream: number;
        coeff_fuel: number;
      }
    | {
        transport: Transport.car;
        coeff_upstream: number;
        coeff_fuel: number;
        passengers_nb: number;
        is_hitch_hike: boolean;
      }
    | {
        transport: Transport.ecar;
        coeff_upstream: number;
        coeff_fuel: number;
        passengers_nb: number;
      }
    | {
        transport: Transport.ferry;
        coeff_total: number;
        options: string;
      }
    | {
        transport: Transport.plane;
        coeff_path_detour: number;
        coeff_contrails: number;
        coeff_fuel: number;
        coeff_upstream: number;
        holding: number;
      }
    | {
        transport: Transport.train;
        coeff_upstream: number;
      }
    | {
        transport: Transport.sail;
        coeff_total: number;
      }
  ))[];
};

export type ApiResponse = {
  my_trip: string;
  direct_trip?: string;
  alternative_trip?: string;
  error: string;
  geometries: TripStepGeometry[];
  trips: TripResult[];
};

export type MyTripData = {
  NAME: string;
  colors: string;
  kgCO2eq: number;
  "Mean of Transport": Transport;
  step: number;
};

export type DirectTripData = {
  ISO2: string;
  NAME: string;
  EF_tot: number;
  colors: string;
  path_length: number;
  kgCO2eq: number;
  "Mean of Transport": Transport;
  Type: string;
};

export enum EmissionsCategory {
  infra = "infra",
  construction = "construction",
  fuel = "fuel",
  kerosene = "kerosene",
  contrails = "contrails",
  bikeBuild = "bikeBuild",
  none = "none",
  cabin = "cabin",
  vehicle = "vehicle",
  cabinVehicle = "cabinVehicle",
}

export type Trip = {
  steps: TripStep[];
  label: string;
  totalEmissions: number;
  isMainTrip?: boolean;
};

export type TripStep = {
  emissions: number;
  emissionParts: {
    emissionSource: string;
    color: string;
    emissions: number;
  }[];
  distance: number;
} & (
  | {
      transport: Transport.bicycle;
      coeff_upstream: number;
    }
  | {
      transport: Transport.bus;
      coeff_upstream: number;
      coeff_fuel: number;
    }
  | {
      transport: Transport.car;
      coeff_upstream: number;
      coeff_fuel: number;
      passengers_nb: number;
      is_hitch_hike: boolean;
    }
  | {
      transport: Transport.ecar;
      coeff_upstream: number;
      coeff_fuel: number;
      passengers_nb: number;
    }
  | {
      transport: Transport.ferry;
      coeff_total: number;
      options: string;
    }
  | {
      transport: Transport.plane;
      coeff_path_detour: number;
      coeff_contrails: number;
      coeff_fuel: number;
      coeff_upstream: number;
      holding: number;
    }
  | {
      transport: Transport.train;
      coeff_upstream: number;
    }
  | {
      transport: Transport.sail;
      coeff_total: number;
    }
);

export type Geometry = {
  transportMeans: string;
  label: string;
  color: string;
  coordinates: [number, number][];
};

export enum SimulationType {
  mainTripVsOtherTransportMeans = "mainTripVsOtherTransportMeans",
  mainTripVsOtherTrip = "mainTripVsOtherTrip",
  mainTripOnly = "mainTripOnly",
}

export type SimulationResults = {
  inputs: { mainTrip: Step[]; alternativeTrip?: Step[] };
  trips: Trip[];
  tripGeometries: Geometry[];
  simulationType: SimulationType;
  error?: string;
};
