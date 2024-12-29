import type { Transport } from "../../../types";

export const transportMeanIsCar = (transportMean: Transport) =>
  ["Car", "eCar"].includes(transportMean);

export const transportMeanIsFerry = (transportMean: Transport) =>
  transportMean === "Ferry";
