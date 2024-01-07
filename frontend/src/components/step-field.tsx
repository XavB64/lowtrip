import { Button, Stack } from "@mui/material";
import {
  BiSolidPlaneAlt,
  BiSolidCar,
  BiSolidTrain,
  BiSolidBus,
} from "react-icons/bi";
import { FaFerry } from "react-icons/fa6";
import { Step, Transport } from "../types";
import { useEffect, useRef } from "react";

interface StepFieldProps {
  isDeparture?: boolean;
  updateStep: (index: number, data: Partial<Step>) => void;
  steps: Step[];
  index: number;
}

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

export function StepField({
  isDeparture,
  updateStep,
  steps,
  index,
}: StepFieldProps) {
  const autoCompleteRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      // @ts-ignore
      autoCompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        { fields: ["geometry", "name"] }
      );
    }
    if (autoCompleteRef.current) {
      // @ts-ignore
      autoCompleteRef.current.addListener("place_changed", async function () {
        // @ts-ignore
        const place = await autoCompleteRef.current.getPlace();
        updateStep(index, {
          locationCoords: [
            place.geometry.location.lat(),
            place.geometry.location.lng(),
          ],
        });
      });
    }
  }, [inputRef, updateStep, index]);

  return (
    <>
      {!isDeparture && (
        <Stack direction={"row"} alignItems="center" marginBottom={1}>
          <p style={{ paddingRight: 5, textAlign: "end" }}>by</p>
          {TRANSPORTS.map((item) => (
            <Button
              key={item.value}
              onClick={() => updateStep(index, { transportMean: item.value })}
              style={{
                padding: 0,
                width: "40px",
                minWidth: "40px",
                height: "40px",
                borderRadius: "100px",
                backgroundColor:
                  item.value ===
                  steps.find((step) => step.index === index)?.transportMean
                    ? "#474747"
                    : "#b7b7b7",
                color: "white",
                marginLeft: 5,
              }}
            >
              {item.icon}
            </Button>
          ))}
        </Stack>
      )}
      <input
        ref={inputRef}
        placeholder={isDeparture ? "From..." : "To..."}
        style={{
          width: "-webkit-fill-available",
          height: "40px",
          padding: "9px",
          border: "1px solid lightgrey",
          borderRadius: "20px",
          backgroundColor: "white",
          marginBottom: 1,
          fontSize: "16px",
        }}
      />
    </>
  );
}
