import React from "react";

export interface Step {
  index: number;
  locationName?: string;
  locationCoords?: [number, number];
  transportMean?: Transport;
  passengers?: number;
  currentInputRef?: React.MutableRefObject<any>;
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
  bus = "Bus",
  train = "Train",
  ferry = "Ferry",
}

export interface ApiResponse {
  data: {
    gdf: string;
    my_trip: string;
    direct_trip?: string;
    alternative_trip?: string;
  };
}

export interface Gdf {
  type: string;
  features: {
    id: string;
    type: string;
    properties: { colors: string; "Mean of Transport": string };
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
