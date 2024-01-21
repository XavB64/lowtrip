import { Box, Button, CircularProgress, Tab, Tabs, Stack } from "@mui/material";
import axios from "axios";
import { useState } from "react";

import { Step } from "../types";
import { API_URL } from "../config";
import { ApiResponse } from "../types";
import { StepField } from "./step-field";

interface FormProps {
  setResponse: (response: ApiResponse) => void;
  stepsProps: {
    values: Step[];
    addStep: () => void;
    removeStep: (index: number) => void;
    updateStep: (index: number, data: Partial<Step>) => void;
  };
}

export const Form = ({ setResponse, stepsProps }: FormProps) => {
  const { values: steps, addStep, removeStep, updateStep } = stepsProps;
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (
      steps.length < 2 ||
      !steps[0].locationCoords ||
      !steps[1].locationCoords
    )
      throw new Error("At least one step required");
    setIsLoading(true);
    const formData = new FormData();
    formData.append(
      "departure_coord",
      `${steps[0].locationCoords[0]}, ${steps[0].locationCoords[1]}`
    );
    formData.append(
      "arrival_coord",
      `${steps[1].locationCoords[0]}, ${steps[1].locationCoords[1]}`
    );
    axios
      .post(API_URL, formData, {
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
    <>
      <Box>
        <Tabs
          value={0}
          // onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab
            label="My trip"
            sx={{
              textTransform: "none",
              fontFamily: "Montserrat",
              backgroundColor: "#efefef",
              borderRadius: "12px 12px 0 0",
            }}
          />
          <Tab
            label="Alternative trip"
            sx={{ textTransform: "none", fontFamily: "Montserrat" }}
          />
        </Tabs>
      </Box>
      <Stack
        sx={{
          padding: 3,
          backgroundColor: "#efefef",
          borderRadius: "0 12px 12px 12px",
          justifyContent: "right",
        }}
      >
        <StepField
          isDeparture
          steps={steps}
          updateStep={updateStep}
          removeStep={removeStep}
          index={1}
        />
        {steps.slice(1).map((step) => (
          <StepField
            key={step.index}
            steps={steps}
            removeStep={removeStep}
            updateStep={updateStep}
            index={step.index}
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
          <p>Add step</p>
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
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
            height: "60px",
          }}
        >
          {isLoading ? (
            <CircularProgress style={{ color: "white" }} />
          ) : (
            <p>Compute emissions</p>
          )}
        </Button>
      </Stack>
    </>
  );
};
