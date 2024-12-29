import { Step } from "../../../../../types";

export const stepsAreInvalid = (steps: Step[]) =>
  steps.some((step, index) => {
    const isDeparture = index === 0;
    return !step.locationCoords || (!isDeparture && !step.transportMean);
  });

type StepsForApi = {
  lon: { [key: string]: string };
  lat: { [key: string]: string };
  transp: { [key: string]: string };
  nb: { [key: string]: number | string };
  options: { [key: string]: string };
};

const formatStepsForApi = (steps: Step[]): StepsForApi =>
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

export const getPayload = (steps: Step[], stepsToCompare?: Step[]) => {
  const formData = new FormData();
  if (stepsToCompare) {
    formData.append("mode", "2");
    formData.append(
      "my-trip",
      JSON.stringify(formatStepsForApi(stepsToCompare)),
    );
    formData.append(
      "alternative-trip",
      JSON.stringify(formatStepsForApi(steps)),
    );
  } else {
    formData.append("mode", "1");
    formData.append("my-trip", JSON.stringify(formatStepsForApi(steps)));
  }
  return formData;
};
