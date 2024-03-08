import axios from "axios";
import { useState } from "react";

import {
  Button,
  Divider,
  HStack,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { BiSolidPlusCircle } from "react-icons/bi";
import { API_URL } from "../config";
import { ApiResponse, Step } from "../types";
import { formatStepsForApi } from "../utils";
import { PrimaryButton } from "./primary-button";
import { StepField } from "./step-field";
import ErrorModal from "./error-modal";

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
  const { values: steps, addStep, removeStep, updateStep } = stepsProps;
  const { isOpen, onOpen: openErrorModal, onClose } = useDisclosure();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        Add step
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
          Compare with this trip
        </PrimaryButton>
      ) : (
        <>
          {steps.length < 3 && <Text alignSelf="center">Compare with...</Text>}
          <HStack w="100%">
            <PrimaryButton
              onClick={handleSubmit}
              isDisabled={formIsNotValid}
              isLoading={isLoading}
            >
              {steps.length < 3

                ? "Other modes"
                : "Compute emissions"}
            </PrimaryButton>
            <PrimaryButton
              onClick={changeTab}
              isDisabled={formIsNotValid}
              isLoading={false}
              variant="outline"
            >
              {steps.length < 3 
                ? "Another trip" 
                : "Compare to another trip"}
            </PrimaryButton>
          </HStack>
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
