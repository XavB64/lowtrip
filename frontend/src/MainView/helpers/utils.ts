import type { Step, Transport } from "types";

export const stepsAreInvalid = (steps: Step[]) =>
  steps.some((step, index) => {
    const isDeparture = index === 0;
    return !step.locationCoords || (!isDeparture && !step.transportMean);
  });

export const transportMeanIsCar = (transportMean: Transport) =>
  transportMean === "car" || transportMean === "ecar";

export const transportMeanIsFerry = (transportMean: Transport) =>
  transportMean === "ferry";

type ApiStep = {
  lon: number;
  lat: number;
  ["transport-mean"]: Transport;
  ["passengers-nb"]?: number;
  ["ferry-option"]?: string;
};

type ApiTrip = {
  departure: {
    lon: number;
    lat: number;
  };
  steps: ApiStep[];
};

export const formatStepsForApi = (steps?: Step[]): ApiTrip | undefined => {
  if (!steps) return undefined;
  if (steps.length < 2) throw new Error("Trips must have 1 step at least");

  const departureStep = steps[0];
  if (!departureStep.locationCoords)
    throw new Error("Missing locationCoords in step");
  const departure = {
    lon: departureStep.locationCoords[1],
    lat: departureStep.locationCoords[0],
  };

  const apiSteps = steps.slice(1).map((step) => {
    if (!step.locationCoords) throw new Error("Missing locationCoords in step");
    if (!step.transportMean) throw new Error("Missing transport mean in step");

    return {
      lon: step.locationCoords[1],
      lat: step.locationCoords[0],
      "transport-mean": step.transportMean,
      "passengers-nb": step.passengers,
      "ferry-option": step.options,
    };
  });

  return {
    departure,
    steps: apiSteps,
  };
};
