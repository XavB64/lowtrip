import { TFunction } from "i18next";
import { Step } from "../../types";

export const stepsAreInvalid = (steps: Step[]) =>
  steps.some((step, index) => {
    const isDeparture = index === 0;
    return !step.locationCoords || (!isDeparture && !step.transportMean);
  });

const formatMissingParams = (missingParams: string[], t: TFunction) => {
  if (missingParams.length === 0) return "";
  if (missingParams.length === 1) return missingParams[0];
  if (missingParams.length === 2)
    return `${missingParams[0]} ${t("form.adviceText.and")} ${
      missingParams[1]
    }`;
  const lastParam = missingParams.pop();
  return `${missingParams.join(", ")} ${t("form.adviceText.and")} ${lastParam}`;
};

const formatMissingParamsForSeveralSteps = (
  t: TFunction,
  missingLocations: number,
  missingTransportMeans: number
) => {
  if (missingLocations === 0) {
    if (missingTransportMeans === 0) return "";
    if (missingTransportMeans === 1)
      return t("form.adviceText.missingTransportMean");
    return t("form.adviceText.missingTransportMeans");
  }
  if (missingLocations === 1) {
    if (missingTransportMeans === 0)
      return t("form.adviceText.missingLocation");
    if (missingTransportMeans === 1)
      return t("form.adviceText.missingLocationAndTransportMean");
    return t("form.adviceText.missingLocationAndTransportMeans");
  }
  if (missingTransportMeans === 0) return t("form.adviceText.missingLocations");
  if (missingTransportMeans === 1)
    return t("form.adviceText.missingLocationsAndTransportMean");
  return t("form.adviceText.missingLocationsAndTransportMeans");
};

// This function is used to generate the advice text displayed to the user when the form is not fully filled.
// Examples:
//   Renseignez une origine puis comparez avec...
//   Renseignez une destination puis comparez avec...
//   Renseignez un mode de transport puis comparez avec...
//   Renseignez une origine et une destination puis comparez avec...
//   Renseignez une destination et un mode de transport puis comparez avec...
//   Renseignez une origine, une destination et un mode de transport puis comparez avec...
//   Renseignez le point d'étape manquant puis comparez avec...
//   Renseignez le mode de transport manquant puis comparez avec...
//   Renseignez le point d'étape et les modes de transport manquants puis comparez avec...
//   Renseignez les points d'étape et le mode de transport manquants puis comparez avec...
//   Renseignez les points d'étape et les modes de transport manquants puis comparez avec...
export const getAdviceTextTranslation = (
  t: TFunction,
  steps: Step[],
  isSecondForm: boolean
) => {
  let missingParamsString = "";
  if (steps.length === 2) {
    const missingParams: string[] = [];
    if (!steps[0].locationCoords) {
      missingParams.push(t("form.adviceText.departure"));
    }
    if (!steps[1].locationCoords) {
      missingParams.push(t("form.adviceText.destination"));
    }
    if (!steps[1].transportMean) {
      missingParams.push(t("form.adviceText.transportMean"));
    }
    missingParamsString = formatMissingParams(missingParams, t);
  } else {
    // more than 2 steps to manage
    const { missingLocations, missingTransportMeans } = steps.reduce(
      (result, step, index) => {
        const isFirstStep = index === 0;
        return {
          missingLocations: !step.locationCoords
            ? result.missingLocations + 1
            : result.missingLocations,
          missingTransportMeans:
            !step.transportMean && !isFirstStep
              ? result.missingTransportMeans + 1
              : result.missingTransportMeans,
        };
      },
      { missingLocations: 0, missingTransportMeans: 0 }
    );
    missingParamsString = formatMissingParamsForSeveralSteps(
      t,
      missingLocations,
      missingTransportMeans
    );
  }

  if (!missingParamsString.length)
    return isSecondForm ? undefined : t("form.adviceText.compareWith");
  return t(
    !isSecondForm ? "form.adviceText.main" : "form.adviceText.mainSecondForm",
    {
      missingParams: missingParamsString,
    }
  );
};
