import { Button, Stack } from "@mui/material";
import StationField from "./StationField";
import {
  BiSolidPlaneAlt,
  BiSolidCar,
  BiSolidTrain,
  BiSolidBus,
} from "react-icons/bi";
import { FaFerry } from "react-icons/fa6";

const TRANSPORTS = [
  {
    value: "plane",
    icon: <BiSolidPlaneAlt size={20} />,
  },
  {
    value: "train",
    icon: <BiSolidTrain size={20} />,
  },
  {
    value: "car",
    icon: <BiSolidCar size={20} />,
  },
  {
    value: "bus",
    icon: <BiSolidBus size={20} />,
  },
  {
    value: "ferry",
    icon: <FaFerry size={20} />,
  },
];

export function DestinationField({ destination, updateDestinations }) {
  return (
    <>
      <Stack direction={"row"} alignItems="center" marginBottom={1}>
        <p style={{ paddingRight: 5, textAlign: "baseline" }}>by</p>
        {TRANSPORTS.map((item) => (
          <Button
            key={item.value}
            onClick={() => {
              const newDestination = {
                ...destination,
                transportMean: item.value,
              };
              updateDestinations(newDestination);
            }}
            style={{
              padding: 0,
              width: "40px",
              minWidth: "40px",
              height: "40px",
              borderRadius: "100px",
              backgroundColor:
                item.value === destination.transportMean
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
      <StationField
        step={destination.step}
        updateLocation={(newLocation) => {
          const newDestination = { ...destination, location: newLocation };
          updateDestinations(newDestination);
        }}
      />
    </>
  );
}
