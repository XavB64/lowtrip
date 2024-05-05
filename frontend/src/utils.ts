import { Step } from "./types";

interface StepsForApi {
  lon: { [key: string]: string };
  lat: { [key: string]: string };
  transp: { [key: string]: string };
  nb: { [key: string]: number | string };
  options: { [key: string]: string };
}

export const formatStepsForApi = (steps: Step[]): StepsForApi =>
  steps.reduce(
    (acc, step, i) => {
      const index = i.toString();
      if (step.locationCoords) {
        acc.lon[index] = step.locationCoords[1].toString();
        acc.lat[index] = step.locationCoords[0].toString();
      }
      acc.transp[index] = step.transportMean ?? "";
      acc.nb[index] = step.passengers ?? 1;
      acc.options[index] = step.options ?? "";
      return acc;
    },
    { lon: {}, lat: {}, transp: {}, nb: {}, options: {} } as StepsForApi,
  );

export const checkIsOnMobile = () => {
  return window.innerWidth < 600;
};
