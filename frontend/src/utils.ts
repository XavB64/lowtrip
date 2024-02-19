import { Step } from "./types";

export function formatStepsForApi(steps: Step[]) {
  const lon = steps.reduce((jsonResult, step, index) => {
    jsonResult[index.toString()] = step.locationCoords![1].toString();
    return jsonResult;
  }, {} as { [key: string]: string });
  const lat = steps.reduce((jsonResult, step, index) => {
    jsonResult[index.toString()] = step.locationCoords![0].toString();
    return jsonResult;
  }, {} as { [key: string]: string });
  const transp = steps.reduce((jsonResult, step, index) => {
    jsonResult[index.toString()] = step.transportMean ?? "";
    return jsonResult;
  }, {} as { [key: string]: string });
  const nb = steps.reduce((jsonResult, step, index) => {
    jsonResult[index.toString()] = step.passengers ?? 1;
    return jsonResult;
  }, {} as { [key: string]: number });
  return { lon, lat, transp, nb };
}
