import axios from "axios";
import { useState } from "react";

import { Step } from "../types";
import { API_URL } from "../config";
import { ApiResponse } from "../types";
import { StepField } from "./step-field";
import { formatStepsForApi } from "../utils";
import { Button, Spinner, VStack } from "@chakra-ui/react";

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
}

export const Form = ({
  setResponse,
  stepsProps,
  stepsToCompare,
  afterSubmit,
}: FormProps) => {
  const { values: steps, addStep, removeStep, updateStep } = stepsProps;
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
        setResponse(response);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(async () => {
        setIsLoading(false);
        await delay(200);
        afterSubmit();
      });
  };

  return (
    <VStack
      padding={5}
      backgroundColor="#efefef"
      borderRadius="0 12px 12px 12px"
      justifyContent="right"
      alignItems="start"
    >
      {steps.map((step, index) => (
        <StepField
          key={`main-form-${index}`}
          step={step}
          updateStep={updateStep}
          removeStep={removeStep}
        />
      ))}

      <Button padding={0} color="#b7b7b7" onClick={addStep} variant="ghost">
        Add step
      </Button>

      <Button
        onClick={handleSubmit}
        isDisabled={isLoading || formIsNotValid}
        borderRadius="20px"
        padding={0}
        colorScheme="blue"
        margin={2}
        width="100%"
        height="50px"
        cursor={formIsNotValid ? "not-allowed" : "auto"}
      >
        {isLoading ? <Spinner /> : "Compute emissions"}
      </Button>
    </VStack>
  );
};
