/* eslint-disable @typescript-eslint/no-non-null-assertion */
import i18next from "i18next";
import {
  ApiResponse,
  SimulationResults,
  Transport,
  TripStep,
  SimulationType,
  type Step,
} from "../../../types";

export const formatResponse = (
  inputs: { mainSteps: Step[]; altSteps?: Step[] },
  data: ApiResponse["data"],
): Omit<SimulationResults, "inputs"> => {
  let simulationType = SimulationType.mainTripVsOtherTransportMeans;
  if (inputs.mainSteps.length > 1) {
    simulationType = SimulationType.mainTripOnly;
  }
  if (inputs.altSteps) {
    simulationType = SimulationType.mainTripVsOtherTrip;
  }

  const needToLabelTripSteps =
    simulationType !== SimulationType.mainTripVsOtherTransportMeans;

  const trips = data.trips.map((trip) => {
    const formattedSteps: TripStep[] = [];
    let totalEmissions = 0;

    trip.steps.forEach((step, index) => {
      const emissionParts: TripStep["emissionParts"] = [];
      let stepEmissions = 0;
      step.emissions.forEach((emission) => {
        stepEmissions += emission.kg_co2_eq;
        emissionParts.push({
          emissionSource: needToLabelTripSteps
            ? `${index + 1}. ${step.transport_means} - ${emission.name}`
            : emission.name,
          color: emission.color,
          emissions: emission.kg_co2_eq,
        });
      });

      totalEmissions += stepEmissions;
      formattedSteps.push({
        emissions: stepEmissions,
        transportMeans: step.transport_means as Transport,
        emissionParts,
      });
    });

    let label: string;
    if (trip.name === "MAIN_TRIP") {
      if (inputs.mainSteps.length === 1) {
        label = i18next.t(
          `chart.transportMeans.${inputs.mainSteps[0].transportMean!}`,
        );
      } else {
        label = i18next.t("chart.transportMeans.myTrip");
      }
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
