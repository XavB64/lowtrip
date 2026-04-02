// Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { useMemo } from "react";

import { Divider, Text, VStack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { BiSolidPlusCircle } from "react-icons/bi";

import Button from "common/components/Button";
import { useSimulationContext } from "common/context/simulationContext";
import { TRIP_TYPE } from "types";

import ErrorModal from "./error-modal";
import { getAdviceTextTranslation } from "./helpers/translationHelper";
import { stepsAreInvalid } from "./helpers/utils";
import { StepField } from "./step-field";
import "./Form.scss";

type FormProps = {
  displayedTrip: TRIP_TYPE;
  showAlternativeForm?: () => void;
};

const Form = ({ displayedTrip, showAlternativeForm }: FormProps) => {
  const { t } = useTranslation();

  const {
    steps,
    alternativeSteps,
    errorMessage,
    isLoading,
    modalContext: { isOpen, onClose },
    addStep,
    updateStep,
    removeStep,
    submitForm,
  } = useSimulationContext();

  const formIsNotValid = useMemo(() => {
    if (displayedTrip === TRIP_TYPE.ALTERNATIVE) {
      const mainFormIsNotValid = stepsAreInvalid(alternativeSteps);
      if (mainFormIsNotValid) return true;
    }
    return stepsAreInvalid(steps);
  }, [displayedTrip, alternativeSteps, steps]);

  const adviceText = useMemo(() => {
    if (
      displayedTrip === TRIP_TYPE.ALTERNATIVE &&
      stepsAreInvalid(alternativeSteps)
    ) {
      return t("form.adviceText.previousFormIsInvalid");
    }
    return getAdviceTextTranslation(t, steps, !!alternativeSteps);
  }, [t, displayedTrip, steps, alternativeSteps]);

  return (
    <div
      className={`form ${displayedTrip === TRIP_TYPE.ALTERNATIVE ? "alternative-trip" : ""}`}
    >
      {(displayedTrip === TRIP_TYPE.MAIN ? steps : alternativeSteps).map(
        (step) => (
          <StepField
            key={`main-form-${step.id}`}
            step={step}
            updateStep={(index, data) =>
              updateStep(displayedTrip, step.index, data)
            }
            removeStep={(index) => removeStep(displayedTrip, index)}
          />
        ),
      )}

      <Button
        className="add-step-button"
        onClick={() => addStep(displayedTrip)}
      >
        <span className="icon-wrapper">
          <BiSolidPlusCircle />
        </span>
        {t("form.addStep")}
      </Button>

      <Divider
        borderColor="lightgrey.500"
        opacity={1}
        width="100%"
        alignSelf="center"
        my={3}
      />

      <VStack w="100%">
        {adviceText && <Text textAlign="center">{adviceText}</Text>}
        {displayedTrip === TRIP_TYPE.ALTERNATIVE ? (
          stepsAreInvalid(steps) ? null : (
            <Button
              onClick={() => submitForm(steps, alternativeSteps)}
              disabled={formIsNotValid}
              loading={isLoading}
            >
              {t("form.compareWithThisTrip")}
            </Button>
          )
        ) : (
          <div className="buttons-row">
            <Button
              onClick={() => submitForm(steps)}
              disabled={formIsNotValid}
              loading={isLoading}
              className="form-action-button"
            >
              {steps.length < 3
                ? t("form.otherTransportMeans")
                : t("form.computeEmissions")}
            </Button>
            {showAlternativeForm && (
              <Button
                onClick={showAlternativeForm}
                disabled={formIsNotValid}
                className="form-action-button"
                outline
              >
                {steps.length < 3
                  ? t("form.anotherTrip")
                  : t("form.compareToAnotherTrip")}
              </Button>
            )}
          </div>
        )}
      </VStack>

      <ErrorModal
        isOpen={isOpen}
        onClose={onClose}
        errorMessage={errorMessage}
      />
    </div>
  );
};

export default Form;
