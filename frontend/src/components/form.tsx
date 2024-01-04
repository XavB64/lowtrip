import { Box, Button, Tab, Tabs } from "@mui/material";

import StationField from "./station-field";
import { DestinationField } from "./destination-field";
import { Step } from "../types";
import axios from "axios";
import { API_URL } from "../config";
import { ApiResponse } from "../types";

interface FormProps {
  setResponse: (response: ApiResponse) => void;
  departure: Step;
  destinations: Step[];
  setDestinations: (destinations: Step[]) => void;
}

export function Form({
  setResponse,
  departure,
  destinations,
  setDestinations,
}: FormProps) {
  const handleSubmit = async () => {
    if (
      destinations.length === 0 ||
      !departure.locationCoords ||
      !destinations[0].locationCoords
    )
      throw new Error("At least one step required");
    const formData = new FormData();
    formData.append(
      "departure_coord",
      `${departure.locationCoords[0]}, ${departure.locationCoords[1]}`
    );
    formData.append(
      "arrival_coord",
      `${destinations[0].locationCoords[0]}, ${destinations[0].locationCoords[1]}`
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
        <StationField isDeparture inputRef={departure.inputRef} />
        {destinations.map((destination, index) => (
          <DestinationField
            key={index}
            destination={destination}
            updateDestinations={() => {}}
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
