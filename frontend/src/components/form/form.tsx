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

import {
  Button,
  Divider,
  Stack,
  Text,
  VStack,
  useBreakpoint,
} from "@chakra-ui/react";
import { BiSolidPlusCircle } from "react-icons/bi";
import { TRIP_TYPE } from "../../types";
import { PrimaryButton } from "../primary-button";
import { StepField } from "./step-field";
import ErrorModal from "./error-modal";
import { useTranslation } from "react-i18next";
import { stepsAreInvalid } from "./helpers/utils";
import { getAdviceTextTranslation } from "./helpers/translationHelper";
import { useSimulationContext } from "../../context/simulationContext";

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

  const breakpoint = useBreakpoint();

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
    <VStack
      paddingY={5}
      paddingX={[3, 5]}
      backgroundColor="#efefef"
      borderRadius={`${displayedTrip === TRIP_TYPE.ALTERNATIVE ? "12px 0" : "0 12px"} 12px 12px`}
      justifyContent="right"
      alignItems="start"
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
        onClick={() => addStep(displayedTrip)}
        colorScheme="lightgrey"
        borderRadius="20px"
        color="black"
        leftIcon={<BiSolidPlusCircle />}
      >
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
            <PrimaryButton
              onClick={() => submitForm(TRIP_TYPE.ALTERNATIVE)}
              isDisabled={formIsNotValid}
              isLoading={isLoading}
            >
              {t("form.compareWithThisTrip")}
            </PrimaryButton>
          )
        ) : (
          <>
            <Stack
              w="100%"
              direction={breakpoint === "base" ? "column" : "row"}
            >
              <PrimaryButton
                onClick={() => submitForm(TRIP_TYPE.MAIN)}
                isDisabled={formIsNotValid}
                isLoading={isLoading}
              >
                {steps.length < 3
                  ? t("form.otherTransportMeans")
                  : t("form.computeEmissions")}
              </PrimaryButton>
              <PrimaryButton
                onClick={showAlternativeForm}
                isDisabled={formIsNotValid}
                isLoading={false}
                variant="outline"
              >
                {steps.length < 3
                  ? t("form.anotherTrip")
                  : t("form.compareToAnotherTrip")}
              </PrimaryButton>
            </Stack>
          </>
        )}
      </VStack>

      <ErrorModal
        isOpen={isOpen}
        onClose={onClose}
        errorMessage={errorMessage}
      />
    </VStack>
  );
};

export default Form;
