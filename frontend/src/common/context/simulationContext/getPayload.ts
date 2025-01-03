import type { Step } from "../../../types";

type StepsForApi = {
  lon: string[];
  lat: string[];
  transp: string[];
  nb: string[];
  options: string[];
};

const formatStepsForApi = (steps: Step[]): StepsForApi =>
  steps.reduce(
    (acc, step) => {
      if (!step.locationCoords) {
        throw new Error("Missing locationCoords in step");
      }

      acc.lon.push(step.locationCoords[1].toString());
      acc.lat.push(step.locationCoords[0].toString());
      acc.transp.push(step.transportMean ?? "");
      acc.nb.push(step.passengers ?? "1");
      acc.options.push(step.options ?? "");
      return acc;
    },
    { lon: [], lat: [], transp: [], nb: [], options: [] } as StepsForApi,
  );

export const getPayload = (steps: Step[], alternativeSteps?: Step[]) => {
  if (alternativeSteps) {
    return {
      mode: 2,
      "my-trip": formatStepsForApi(steps),
      "alternative-trip": formatStepsForApi(alternativeSteps),
    };
  }
  return {
    mode: 1,
    "my-trip": formatStepsForApi(steps),
  };
};
