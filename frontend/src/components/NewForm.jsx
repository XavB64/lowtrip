import { useState } from "react";
import { Box, Button, Tab, Tabs } from "@mui/material";

import StationField from "./StationField";
import { DestinationField } from "./DestinationField";

// interface Step { location?: string, coordinates?: [number, number] }
// interface StepWithTransport { step: Step, transportMean?: Transport }

export function NewForm() {
  const [departure, setDeparture] = useState({}); // Step
  const [destinations, setDestinations] = useState([{}]); // StepWithTransport[]
  return (
    <>
      <Box>
        <Tabs
          value={"hello"}
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
        padding={3}
        backgroundColor="#efefef"
        borderRadius="0 12px 12px 12px"
      >
        <StationField
          isDepature
          step={departure}
          updateLocation={setDeparture}
        />
        {destinations.map((destination, index) => (
          <DestinationField
            key={index}
            destination={destination}
            updateDestinations={(newDestination) => {
              setDestinations(
                destinations.map((item, i) =>
                  i === index ? newDestination : item
                )
              );
            }}
          />
        ))}
        <Button
          onClick={() => {
            setDestinations([...destinations, {}]);
          }}
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
          onClick={() => {
            console.log("submit !");
          }}
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
