import { Box, Button, Tab, Tabs } from "@mui/material";

import { Step } from "../types";
import axios from "axios";
import { API_URL } from "../config";
import { ApiResponse } from "../types";
import { StepField } from "./step-field";

interface FormProps {
  setResponse: (response: ApiResponse) => void;
  steps: {
    values: Step[];
    addStep: () => void;
    updateStep: (index: number, data: Partial<Step>) => void;
  };
}

export function Form({ setResponse, steps }: FormProps) {
  const handleSubmit = async () => {
    if (
      steps.values.length < 2 ||
      !steps.values[0].locationCoords ||
      !steps.values[1].locationCoords
    )
      throw new Error("At least one step required");
    const formData = new FormData();
    formData.append(
      "departure_coord",
      `${steps.values[0].locationCoords[0]}, ${steps.values[0].locationCoords[1]}`
    );
    formData.append(
      "arrival_coord",
      `${steps.values[1].locationCoords[0]}, ${steps.values[1].locationCoords[1]}`
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
      <Box
        sx={{
          padding: 3,
          backgroundColor: "#efefef",
          borderRadius: "0 12px 12px 12px",
        }}
      >
        <StepField
          isDeparture
          steps={steps.values}
          updateStep={steps.updateStep}
          index={1}
        />
        {steps.values.slice(1).map((step) => (
          <StepField
            key={step.index}
            steps={steps.values}
            updateStep={steps.updateStep}
            index={step.index}
          />
        ))}
        <Button
          style={{
            padding: 0,
            color: "#b7b7b7",
            marginBottom: 5,
            textTransform: "none",
            fontFamily: "Montserrat",
            fontWeight: 700,
            fontSize: "16px",
          }}
          onClick={steps.addStep}
        >
          <p>Add step</p>
        </Button>

        <Button
          onClick={handleSubmit}
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
          }}
        >
          <p>Compute emissions</p>
        </Button>
      </Box>
    </>
  );
}
