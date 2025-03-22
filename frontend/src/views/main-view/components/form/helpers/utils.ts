import { Step } from "../../../../../types";

export const stepsAreInvalid = (steps: Step[]) =>
  steps.some((step, index) => {
    const isDeparture = index === 0;
    return !step.locationCoords || (!isDeparture && !step.transportMean);
  });
