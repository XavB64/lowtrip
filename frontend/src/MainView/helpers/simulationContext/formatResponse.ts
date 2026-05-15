import i18next from "i18next";

import {
  ApiResponse,
  SimulationResults,
  TripStep,
  SimulationType,
  type Step,
} from "types";
import { round } from "utils";

export const formatResponse = (
  inputs: { mainSteps: Step[]; altSteps?: Step[] },
  data: ApiResponse,
): Omit<SimulationResults, "inputs"> => {
  let simulationType = SimulationType.mainTripVsOtherTransportMeans;
  if (inputs.mainSteps.length > 2) {
    simulationType = SimulationType.mainTripOnly;
  }
  if (inputs.altSteps) {
    simulationType = SimulationType.mainTripVsOtherTrip;
  }

  const trips = data.trips.map((trip) => {
    const formattedSteps: TripStep[] = [];
    let totalEmissions = 0;

    const inputSteps =
      trip.name !== "SECOND_TRIP"
        ? inputs.mainSteps
        : (inputs.altSteps as Step[]);

    trip.steps.forEach((step, index) => {
      const { emissions, path_length, ...rest } = step;

      const emissionParts: TripStep["emissionParts"] = [];
      let stepEmissions = 0;
      emissions.forEach((emission) => {
        stepEmissions += emission.kg_co2_eq;
        emissionParts.push({
          emissionSource: emission.name,
          color: emission.color,
          emissions: emission.kg_co2_eq,
          distance: emission.distance,
          coefficient: emission.ef_tot,
        });
      });

      totalEmissions += stepEmissions;
      formattedSteps.push({
        emissions: round(stepEmissions),
        emissionParts,
        distance: path_length,
        departure: inputSteps[index].locationName!,
        arrival: inputSteps[index + 1].locationName!,
        ...rest,
      });
    });

    let label: string;
    if (trip.name === "MAIN_TRIP") {
      label = i18next.t(
        simulationType === SimulationType.mainTripVsOtherTransportMeans
          ? `chart.transportMeans.${inputs.mainSteps[1].transportMean!}`
          : "chart.transportMeans.myTrip",
        { count: inputs.mainSteps[1].passengers },
      );
    } else if (trip.name === "SECOND_TRIP") {
      label = i18next.t("chart.transportMeans.otherTrip");
    } else {
      label = i18next.t(`chart.transportMeans.${trip.name.toLowerCase()}`, {
        count: 1,
      });
    }

    return {
      label,
      totalEmissions,
      isMainTrip: trip.name === "MAIN_TRIP",
      steps: formattedSteps,
    };
  });

  const tripGeometries = data.geometries.flatMap((geometry) => {
    const transportMeans =
      geometry.transport_means === "Road" && geometry.country_label !== null
        ? "road_with_country"
        : geometry.transport_means.toLowerCase();

    return geometry.coordinates.map((coords) => ({
      label: i18next.t(`chart.paths.${transportMeans}_with_details`, {
        countryLabel: geometry.country_label,
        length: Math.round(geometry.length),
      }),
      transportMeans: geometry.transport_means,
      color: geometry.color,
      coordinates: coords,
    }));
  });

  return {
    trips,
    tripGeometries,
    simulationType,
  };
};
