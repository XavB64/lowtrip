import i18next from "i18next";

import {
  ApiResponse,
  SimulationResults,
  TripStep,
  SimulationType,
  type Step,
} from "types";
import { round } from "utils";

type ColorMap = {
  usage: string;
  contrails: string;
  upstream: string;
};

const MAIN_COLORS = {
  contrails: "#7de4f0",
  usage: "#4accdb",
  upstream: "#006773",
};

const ALTERNATIVE_COLORS = {
  contrails: "#ffd1d9",
  usage: "#f299a9",
  upstream: "#df4562",
};

const DIRECT_COLORS = {
  contrails: "#febc78",
  usage: "#E69138",
  upstream: "#B45E06",
};

const getColorMap = (tripName: string) => {
  if (tripName === "MAIN_TRIP") return MAIN_COLORS;
  if (tripName === "SECOND_TRIP") return ALTERNATIVE_COLORS;
  return DIRECT_COLORS;
};

const getEmissionColor = (colorMap: ColorMap, emissionSouce: string) => {
  switch (emissionSouce) {
    case "contrails":
      return colorMap.contrails;
    case "construction":
    case "infra":
    case "bikeBuild":
      return colorMap.upstream;
    default:
      return colorMap.usage;
  }
};

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

    const colorMap = getColorMap(trip.name);

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
          color: getEmissionColor(colorMap, emission.name),
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
