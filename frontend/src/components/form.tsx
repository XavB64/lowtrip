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

interface FormProps {
  setResponse: (response: ApiResponse) => void;
  stepsProps: {
    values: Step[];
    addStep: () => void;
    removeStep: (index: number) => void;
    updateStep: (index: number, data: Partial<Step>) => void;
  };
  stepsToCompare?: Step[];
}

export const Form = ({
  setResponse,
  stepsProps,
  stepsToCompare,
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
      .finally(() => {
        setIsLoading(false);
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

      <Button
        style={{
          padding: 0,
          color: "#b7b7b7",
          marginBottom: 10,
          marginTop: 10,
          textTransform: "none",
          fontFamily: "Montserrat",
          fontWeight: 700,
          fontSize: "16px",
          width: "fit-content",
        }}
        onClick={addStep}
      >
        Add step
      </Button>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || formIsNotValid}
        style={{
          borderRadius: "20px",
          padding: 0,
          color: "white",
          backgroundColor: "#0097A7",
          margin: 2,
          textTransform: "none",
          fontFamily: "Montserrat",
          fontWeight: 700,
          fontSize: "16px",
          width: "100%",
          height: "50px",
          ...(formIsNotValid && { cursor: "not-allowed", opacity: 0.5 }),
        }}
      >
        {isLoading ? <Spinner /> : "Compute emissions"}
      </Button>
    </VStack>
  );
};
