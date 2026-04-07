import i18next from "i18next";

import {
  ApiResponse,
  SimulationResults,
  Transport,
  TripStep,
  SimulationType,
  type Step,
  thumbUp,
} from "types";

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

  const needToLabelTripSteps =
    simulationType !== SimulationType.mainTripVsOtherTransportMeans;

  const trips = data.trips.map((trip) => {
    const formattedSteps: TripStep[] = [];
    let totalEmissions = 0;

    trip.steps.forEach((step, index) => {
      let passengers: number | undefined;
      if (["Car", "Ecar"].includes(step.transport_means)) {
        if (
          simulationType === SimulationType.mainTripVsOtherTransportMeans &&
          trip.name !== "MAIN_TRIP"
        ) {
          passengers = 1;
        } else {
          const input =
            inputs[trip.name === "MAIN_TRIP" ? "mainSteps" : "altSteps"]![
              index + 1
            ];
          passengers =
            !!input.passengers && input.passengers !== thumbUp
              ? Number(input.passengers)
              : 1;
        }
      }

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
        passengers,
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
