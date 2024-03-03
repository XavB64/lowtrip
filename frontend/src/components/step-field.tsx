import { useEffect, useRef, useState } from "react";
import {
  BiSolidBus,
  BiSolidCar,
  BiSolidPlaneAlt,
  BiSolidTrain,
  BiTrash,
  BiBicycle,
} from "react-icons/bi";
import { FaFerry } from "react-icons/fa6";
import { MdElectricCar } from "react-icons/md";
import {IoMdBicycle} from "react-icons/io"

import {
  Box,
  Button,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tooltip as ChakraTooltip,
} from "@chakra-ui/react";
import { Step, Transport } from "../types";

// Tooltip as ChakraTooltip,
// useDisclosure,
// } from "@chakra-ui/react";

const TRANSPORTS = [
  {
    value: Transport.train,
    icon: 
    <ChakraTooltip label="Train" >
    <span>
    <BiSolidTrain size={20} />
    </span>
  </ChakraTooltip> 
  },
  {
    value: Transport.plane,
    icon: 
    <ChakraTooltip label="Plane" >
    <span>
    <BiSolidPlaneAlt size={20} />
    </span>
  </ChakraTooltip> 
  },
  {
    value: Transport.bus,
    icon: 
    <ChakraTooltip label="Bus" >
    <span>
    <BiSolidBus size={20} />
    </span>
  </ChakraTooltip> 
  },
  {
    value: Transport.car,
    icon: 
    <ChakraTooltip label="Car" >
    <span>
    <BiSolidCar size={20} />
    </span>
  </ChakraTooltip> 
  },
  {
    value: Transport.ecar,
    icon: 
    <ChakraTooltip label="Electric Car" >
    <span>
    <MdElectricCar size={20} />
    </span>
  </ChakraTooltip> 
  },
  {
    value: Transport.ferry,
    icon: 
    <ChakraTooltip label="Ferry" >
    <span>
    <FaFerry size={20} />
    </span>
  </ChakraTooltip> 
  },
  {
    value: Transport.bicycle,
    icon :
  <ChakraTooltip label="Bicycle" >
    <span>
    <IoMdBicycle size={20} />
    </span>
  </ChakraTooltip> 
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
      <HStack w="100%">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          placeholder={isDeparture ? "From..." : "To..."}
          style={{
            width: "100%",
            height: "50px",
            padding: "9px",
            border: "1px solid lightgrey",
            borderRadius: "20px",
            backgroundColor: "white",
            marginBottom: 1,
            fontSize: "16px",
          }}
        />
        {step.index > 2 && (
          <IconButton
            onClick={() => removeStep(step.index)}
            aria-label="delete"
            borderRadius="20px"
            icon={<BiTrash size={20} />}
          />
        )}
      </HStack>
      {!isDeparture && (
        <HStack
          direction="row"
          justifyContent="space-between"
          marginBottom={2}
          marginTop={1}
        >
          <Box>
            <span style={{ paddingRight: 5, textAlign: "end" }}>by</span>
            {TRANSPORTS.map((item) =>
              item.value === Transport.car ? (
                <CarButton
                  updateStep={updateStep}
                  isSelected={item.value === step.transportMean}
                  step={step}
                />
              ) : item.value === Transport.ecar ?(
                <ECarButton
                  updateStep={updateStep}
                  isSelected={item.value === step.transportMean}
                  step={step}
                />
              ) :
              (
                <TransportButton
                  updateStep={() =>
                    updateStep(step.index, {
                      transportMean: item.value,
                      passengers: undefined,
                    })
                  }
                  isSelected={item.value === step.transportMean}
                  icon={item.icon}
                />
              )
            )}
          </Box>
        </HStack>
      )}
    </>
  );
};

interface CarButtonProps {
  updateStep: (index: number, data: Partial<Step>) => void;
  isSelected: boolean;
  step: Step;
}

interface ECarButtonProps {
  updateStep: (index: number, data: Partial<Step>) => void;
  isSelected: boolean;
  step: Step;
}

const thumbUp: string = "👍";

const CarButton = ({ updateStep, isSelected, step }: CarButtonProps) => {
  return (
    <Menu>
      <ChakraTooltip label="Thermal Car" >
      <MenuButton position="relative">
        <TransportButton
          icon={<BiSolidCar size={20} />}
          isSelected={isSelected}
        />
        {step.transportMean === 'Car' && step.passengers && (
          <Box
            position="absolute"
            bottom={-1}
            right={-1}
            bgColor="#0097a7"
            color="white"
            borderRadius="full"
            fontSize="xs"
            h={4}
            w={4}
          >
            {step.passengers}
          </Box>
        )}
      </MenuButton>
      </ChakraTooltip>
      <MenuList zIndex={3}>
        {[1, 2, 3, 4, 5, thumbUp].map((number) => (
          <MenuItem
            key={number}
            onClick={() =>
              updateStep(step.index, {
                transportMean: Transport.car,
                passengers: number,
              })
            }
          > {number === thumbUp ? "Hitch-hiking" : `${number} passenger${number > 1 ? "s" : ""}`}
            
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

const ECarButton = ({ updateStep, isSelected, step }: ECarButtonProps) => {
  return (
    <Menu>
      <ChakraTooltip label="Electric car" >
      <MenuButton position="relative">
        <TransportButton
          icon={<MdElectricCar size={20} />}
          isSelected={isSelected}
        />
        {step.transportMean === 'eCar' &&step.passengers && (
          <Box
            position="absolute"
            bottom={-1}
            right={-1}
            bgColor="#0097a7"
            color="white"
            borderRadius="full"
            fontSize="xs"
            h={4}
            w={4}
          >
            {step.passengers}
          </Box>
        )}
      </MenuButton>
      </ChakraTooltip>
      <MenuList zIndex={3}>
        {[1, 2, 3, 4, 5].map((number) => (
          <MenuItem
            key={number}
            onClick={() =>
              updateStep(step.index, {
                transportMean: Transport.ecar,
                passengers: number,
              })
            }
          > {`${number} passenger${number > 1 ? "s" : ""}`}
            
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

interface TransportButtonProps {
  updateStep?: () => void;
  isSelected: boolean;
  icon: JSX.Element;
}

const TransportButton = ({
  updateStep,
  isSelected,
  icon,
}: TransportButtonProps) => {
  return (
    <Button
      onClick={updateStep}
      padding={0}
      width="30px"
      minWidth="30px"
      height="30px"
      borderRadius="100px"
      backgroundColor={isSelected ? "#474747" : "#b7b7b7"}
      color="white"
      marginLeft={2}
    >
      {icon}
    </Button>
  );
};
