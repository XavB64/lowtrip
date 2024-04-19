// // Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// // Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// // This program is free software: you can redistribute it and/or modify
// // it under the terms of the GNU General Public License as published by
// // the Free Software Foundation, either version 3 of the License, or
// // (at your option) any later version.

// // This program is distributed in the hope that it will be useful,
// // but WITHOUT ANY WARRANTY; without even the implied warranty of
// // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// // GNU General Public License for more details.

// // You should have received a copy of the GNU General Public License
// // along with this program.  If not, see <https://www.gnu.org/licenses/>.

import axios from "axios";
import { useState } from "react";

import {
  Button,
  Divider,
  Stack,
  Text,
  VStack,
  useDisclosure,
  useBreakpoint,
} from "@chakra-ui/react";
import { BiSolidPlusCircle } from "react-icons/bi";
import { API_URL } from "../../config";
import { ApiResponse, Step } from "../../types";
import { formatStepsForApi } from "../../utils";
import { PrimaryButton } from "../primary-button";
import { StepField } from "./step-field";
import ErrorModal from "./error-modal";
import { useTranslation } from "react-i18next";

const getPayload = (steps: Step[], stepsToCompare?: Step[]) => {
  const formData = new FormData();
  if (!!stepsToCompare) {
    formData.append("mode", "2");
    formData.append(
      "my-trip",
      JSON.stringify(formatStepsForApi(stepsToCompare))
    );
    formData.append(
      "alternative-trip",
      JSON.stringify(formatStepsForApi(steps))
    );
  } else {
    formData.append("mode", "1");
    formData.append("my-trip", JSON.stringify(formatStepsForApi(steps)));
  }
  return formData;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface FormProps {
  setResponse: (response: ApiResponse) => void;
  stepsProps: {
    values: Step[];
    addStep: () => void;
    removeStep: (index: number) => void;
    updateStep: (index: number, data: Partial<Step>) => void;
  };
  stepsToCompare?: Step[];
  afterSubmit: () => void;
  changeTab?: () => void;
}

export const Form = ({
  setResponse,
  stepsProps,
  stepsToCompare,
  afterSubmit,
  changeTab,
}: FormProps) => {
  const { t } = useTranslation();
  const { values: steps, addStep, removeStep, updateStep } = stepsProps;
  const { isOpen, onOpen: openErrorModal, onClose } = useDisclosure();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const breakpoint = useBreakpoint();

  const formIsNotValid = steps.some((step, index) => {
    const isDeparture = index === 0;
    return !step.locationCoords || (!isDeparture && !step.transportMean);
  });

  const handleSubmit = async () => {
    if (steps.length < 1 || steps.some((step) => !step.locationCoords))
      throw new Error("At least one step required");
    setIsLoading(true);

    const payload = getPayload(steps, stepsToCompare);
    axios
      .post(API_URL, payload, {
        headers: { "Access-Contol-Allow-Origin": "*" },
      })
      .then((response: ApiResponse) => {
        if (response.data.error) {
          setErrorMessage(response.data.error);
          openErrorModal();
        } else {
          setResponse(response);
        }
      })
      .catch((err) => {
        console.log(err);
        openErrorModal();
      })
      .finally(async () => {
        setIsLoading(false);
        await delay(200);
        afterSubmit();
      });
  };

  return (
    <VStack
      paddingY={5}
      paddingX={[3, 5]}
      backgroundColor="#efefef"
      borderRadius={`${stepsToCompare ? "12px 0" : "0 12px"} 12px 12px`}
      justifyContent="right"
      alignItems="start"
    >
      {steps.map((step) => (
        <StepField
          key={`main-form-${step.id}`}
          step={step}
          updateStep={updateStep}
          removeStep={removeStep}
        />
      ))}

      <Button
        onClick={addStep}
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

      {stepsToCompare ? (
        <PrimaryButton
          onClick={handleSubmit}
          isDisabled={formIsNotValid}
          isLoading={isLoading}
        >
          {t("form.compareWithThisTrip")}
        </PrimaryButton>
      ) : (
        <>
          {steps.length < 3 && (
            <Text alignSelf="center">{t("form.compareWith")}</Text>
          )}
          <Stack w="100%" direction={breakpoint === "base" ? "column" : "row"}>
            <PrimaryButton
              onClick={handleSubmit}
              isDisabled={formIsNotValid}
              isLoading={isLoading}
            >
              {steps.length < 3
                ? t("form.otherTransportMeans")
                : t("form.computeEmissions")}
            </PrimaryButton>
            <PrimaryButton
              onClick={changeTab}
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

      <ErrorModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setErrorMessage("");
        }}
        errorMessage={errorMessage}
      />
    </VStack>
  );
};
