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
