/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Step } from "../../../types";
import { stepsAreInvalid } from "../components/form/helpers/utils";
import nextId from "react-id-generator";
import { transportMeanIsCar, transportMeanIsFerry } from "./transports";

const simplifySteps = (steps: Step[]) =>
  steps.map((step) => {
    const simplifiedStep = [step.locationName, step.locationCoords];
    if (step.transportMean) {
      simplifiedStep.push(step.transportMean);
      if (transportMeanIsCar(step.transportMean) && step.passengers) {
        simplifiedStep.push(step.passengers);
      } else if (transportMeanIsFerry(step.transportMean) && step.options) {
        simplifiedStep.push(step.options);
      }
    }
    return simplifiedStep;
  });

export const extractPathStepsFromSimplifiedSteps = (
  simplifiedSteps: any[],
): Step[] =>
  simplifiedSteps.map((step, index) => {
    const baseStep: Step = {
      index,
      id: nextId(),
      locationName: step[0],
      locationCoords: step[1],
    };
    if (step.length > 2) {
      const transportMean = step[2];
      baseStep.transportMean = transportMean;

      if (step.length > 3) {
        if (transportMeanIsCar(transportMean)) {
          baseStep.passengers = step[3];
        } else if (transportMeanIsFerry(transportMean)) {
          baseStep.options = step[3];
        }
      }
    }
    return baseStep;
  });

export const generateUrlToShare = (
  {
    mainTrip,
    alternativeTrip,
  }: {
    mainTrip: Step[];
    alternativeTrip?: Step[];
  },
  setShowCopiedLinkNotification: (showCopiedLinkNotification: boolean) => void,
) => {
  // let url = `https://www.lowtrip.fr?main-trip=${JSON.stringify(mainTrip)}`;
  let url = `localhost:3000?main-trip=${JSON.stringify(simplifySteps(mainTrip))}`;
  if (alternativeTrip && !stepsAreInvalid(alternativeTrip)) {
    url += `&alternative-trip=${JSON.stringify(simplifySteps(alternativeTrip))}`;
  }

  navigator.clipboard
    .writeText(url)
    .then(() => {
      setShowCopiedLinkNotification(true);
      // Hide notification after 3 secondes
      setTimeout(() => {
        setShowCopiedLinkNotification(false);
      }, 3000);
    })
    .catch(function (error) {
      console.error("Failed to copy URL to clipboard: ", error);
    });
};
