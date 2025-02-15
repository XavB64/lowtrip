import i18next from "i18next";
import {
  ApiResponse,
  SimulationResults,
  MyTripData,
  Transport,
  DirectTripData,
  Trip,
  TripStep,
  SimulationType,
} from "../../../types";

const extractTransportMeans = (emissionPartName: string) => {
  if (emissionPartName.includes("Train")) {
    return Transport.train;
  }
  if (emissionPartName.includes("Plane")) {
    return Transport.plane;
  }
  if (emissionPartName.includes("eCar")) {
    return Transport.ecar;
  }
  if (emissionPartName.includes("Car")) {
    return Transport.car;
  }
  if (emissionPartName.includes("Bus")) {
    return Transport.bus;
  }
  if (emissionPartName.includes("Ferry")) {
    return Transport.ferry;
  }
  if (emissionPartName.includes("Bicycle")) {
    return Transport.bicycle;
  }
  if (emissionPartName.includes("Sail")) {
    return Transport.sail;
  }
};

const formatMultiStepsTrip = (trip: MyTripData[], isMainTrip = false): Trip => {
  if (trip.length === 0) {
    return {
      steps: [],
      label: "My trip",
      totalEmissions: 0,
    };
  }

  const steps = trip.reduce((result, tripData, index) => {
    if (index > 0 && tripData.step === trip[index - 1].step) {
      // update the existing step
      const currentStep = result[result.length - 1];
      return [
        ...result.slice(0, -1),
        {
          transportMeans: currentStep.transportMeans,
          emissions: currentStep.emissions + tripData.kgCO2eq,
          emissionParts: [
            ...currentStep.emissionParts,
            {
              emissions: tripData.kgCO2eq,
              emissionSource: tripData.NAME,
              color: tripData.colors,
            },
          ],
        } as TripStep,
      ];
    }

    // create a new step
    const transportMeans =
      extractTransportMeans(tripData.NAME) ||
      extractTransportMeans(trip[0]["Mean of Transport"]);
    if (!transportMeans) {
      console.error(
        `Unknown transport means: ${tripData.NAME} or ${trip[0]["Mean of Transport"]}`,
      );
    }
    return [
      ...result,
      {
        emissions: tripData.kgCO2eq,
        transportMeans,
        emissionParts: [
          {
            emissions: tripData.kgCO2eq,
            emissionSource: tripData.NAME,
            color: tripData.colors,
          },
        ],
      } as TripStep,
    ];
  }, [] as TripStep[]);

  const totalEmissions = steps.reduce(
    (total, step) => total + step.emissions,
    0,
  );

  return {
    steps,
    label: trip[0]["Mean of Transport"],
    totalEmissions,
    isMainTrip,
  };
};

const formatDirectTrips = (trips: DirectTripData[]): Trip[] => {
  const tripsByTransportMeans = trips.reduce(
    (result, tripData) => {
      const transportMeans = tripData["Mean of Transport"];
      const currentTrip = result[transportMeans];
      const newTrip = {
        emissions: (currentTrip?.emissions || 0) + tripData.kgCO2eq,
        emissionParts: [
          ...(currentTrip?.emissionParts || []),
          {
            emissionSource: tripData.NAME,
            color: tripData.colors,
            emissions: tripData.kgCO2eq,
          },
        ],
      };
      return {
        ...result,
        [transportMeans]: {
          transportMeans,
          ...newTrip,
        },
      };
    },
    {} as Record<Transport, TripStep>,
  );

  return Object.values(tripsByTransportMeans).map((trip) => ({
    label: `Direct trip ${trip.transportMeans}`,
    steps: [trip],
    totalEmissions: trip.emissions,
  }));
};

export const formatResponse = (
  data: ApiResponse["data"],
): Omit<SimulationResults, "inputs"> => {
  let simulationType = SimulationType.mainTripOnly;
  const trips: Trip[] = [];

  const isMainTrip = true;
  const myTrip = formatMultiStepsTrip(
    JSON.parse(data.my_trip) as MyTripData[],
    isMainTrip,
  );
  trips.push(myTrip);

  if (data.direct_trip) {
    simulationType = SimulationType.mainTripVsOtherTransportMeans;
    const directTrips = formatDirectTrips(JSON.parse(data.direct_trip));
    trips.push(...directTrips);
  }

  if (data.alternative_trip) {
    simulationType = SimulationType.mainTripVsOtherTrip;
    const alternativeTrip = formatMultiStepsTrip(
      JSON.parse(data.alternative_trip),
    );
    trips.push(alternativeTrip);
  }

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
