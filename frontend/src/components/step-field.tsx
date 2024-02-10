import { Box, Button, IconButton, Stack } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  BiSolidPlaneAlt,
  BiSolidCar,
  BiSolidTrain,
  BiSolidBus,
  BiTrash,
} from "react-icons/bi";
import { FaFerry } from "react-icons/fa6";

import { Step, Transport } from "../types";

const TRANSPORTS = [
  {
    value: Transport.plane,
    icon: <BiSolidPlaneAlt size={20} />,
  },
  {
    value: Transport.train,
    icon: <BiSolidTrain size={20} />,
  },
  {
    value: Transport.car,
    icon: <BiSolidCar size={20} />,
  },
  {
    value: Transport.bus,
    icon: <BiSolidBus size={20} />,
  },
  {
    value: Transport.ferry,
    icon: <FaFerry size={20} />,
  },
];

interface StepFieldProps {
  removeStep: (index: number) => void;
  updateStep: (index: number, data: Partial<Step>) => void;
  step: Step;
}

export const StepField = ({ removeStep, updateStep, step }: StepFieldProps) => {
  const autoCompleteRef = useRef(null);
  const inputRef = useRef(null);

  const [value, setValue] = useState(step.locationName || "");
  const [shoudlReset, setShouldReset] = useState(false);

  const isDeparture = step.index === 1;

  useEffect(() => {
    if (inputRef.current) {
      // @ts-ignore
      autoCompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        { fields: ["geometry", "formatted_address"] }
      );
    }
    if (autoCompleteRef.current) {
      // @ts-ignore
      autoCompleteRef.current.addListener("place_changed", async function () {
        // @ts-ignore
        const place = await autoCompleteRef.current.getPlace();
        if (place) {
          setShouldReset(false);
          updateStep(step.index, {
            locationCoords: [
              place.geometry.location.lat(),
              place.geometry.location.lng(),
            ],
            locationName: place.formatted_address,
          });
          setValue(place.formatted_address);
        }
      });
    }
  }, [inputRef, updateStep, step.index]);

  useEffect(() => {
    if (shoudlReset && step.locationCoords) {
      updateStep(step.index, {
        locationCoords: undefined,
        locationName: undefined,
      });
    }
    if (!shoudlReset) setShouldReset(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <>
      <Stack direction="row" spacing={1} marginTop={1}>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          placeholder={isDeparture ? "From..." : "To..."}
          className="step-field"
        />
        {step.index > 2 && (
          <IconButton
            onClick={() => removeStep(step.index)}
            aria-label="delete"
            style={{ borderRadius: "20px" }}
          >
            <BiTrash size={20} />
          </IconButton>
        )}
      </Stack>
      {!isDeparture && (
        <Stack
          direction="row"
          justifyContent="space-between"
          marginBottom={2}
          marginTop={1}
        >
          <Box>
            <span style={{ paddingRight: 5, textAlign: "end" }}>by</span>
            {TRANSPORTS.map((item) => (
              <Button
                key={item.value}
                onClick={() =>
                  updateStep(step.index, { transportMean: item.value })
                }
                style={{
                  padding: 0,
                  width: "30px",
                  minWidth: "30px",
                  height: "30px",
                  borderRadius: "100px",
                  backgroundColor:
                    item.value === step.transportMean ? "#474747" : "#b7b7b7",
                  color: "white",
                  marginLeft: 5,
                }}
              >
                {item.icon}
              </Button>
            ))}
          </Box>
        </Stack>
      )}
    </>
  );
};
