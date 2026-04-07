import type { Transport } from "types";

export const transportMeanIsCar = (transportMean: Transport) =>
  transportMean === "car" || transportMean === "ecar";

export const transportMeanIsFerry = (transportMean: Transport) =>
  transportMean === "ferry";
