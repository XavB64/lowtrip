// Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { useEffect, useState } from "react";
import {
  BiSolidBus,
  BiSolidCar,
  BiSolidPlaneAlt,
  BiSolidTrain,
  BiTrash,
} from "react-icons/bi";
import { FaFerry } from "react-icons/fa6";
import { MdElectricCar } from "react-icons/md";
import { IoMdBicycle } from "react-icons/io";

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
import { Step, Transport, thumbUp } from "../../types";
import { useTranslation } from "react-i18next";
import CityDropdown, { City } from "./CityDropdown";

const TRANSPORTS = [
  {
    value: Transport.train,
    icon: <BiSolidTrain size={20} />,
  },
  {
    value: Transport.plane,
    icon: <BiSolidPlaneAlt size={20} />,
  },
  {
    value: Transport.bus,
    icon: <BiSolidBus size={20} />,
  },
  {
    value: Transport.car,
    icon: <BiSolidCar size={20} />,
  },
  {
    value: Transport.ecar,
    icon: <MdElectricCar size={20} />,
  },
  {
    value: Transport.ferry,
    icon: <FaFerry size={20} />,
  },
  {
    value: Transport.bicycle,
    icon: <IoMdBicycle size={20} />,
  },
];

interface StepFieldProps {
  removeStep: (index: number) => void;
  updateStep: (index: number, data: Partial<Step>) => void;
  step: Step;
}

export const StepField = ({ removeStep, updateStep, step }: StepFieldProps) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(step.locationName || "");
  const [shoudlReset, setShouldReset] = useState(false);

  const isDeparture = step.index === 1;

  const selectCity = (city: City) => {
    if (!city) return;
    setShouldReset(false);
    updateStep(step.index, {
      locationCoords: [parseFloat(city.lat), parseFloat(city.lon)],
      locationName: city.name,
    });
    setValue(city.name);
  };

  const resetCity = () => {
    updateStep(step.index, {
      locationCoords: undefined,
      locationName: undefined,
    });
    setValue("");
  };

  useEffect(() => {
    if (shoudlReset && step.locationCoords) {
      updateStep(step.index, {
        locationCoords: undefined,
        locationName: undefined,
      });
    }
    if (!shoudlReset) setShouldReset(true);
    // eslint-disable-next-line
  }, [value]);

  return (
    <>
      <HStack w="100%">
        <div
          style={{
            position: "relative",
            width: "100%",
          }}
        >
          <CityDropdown
            selectCity={selectCity}
            resetCity={resetCity}
            stepIndex={step.index}
            stepName={step.locationName}
          />
        </div>

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
            <span style={{ paddingRight: 5, textAlign: "end" }}>
              {t("form.by")}
            </span>
            {TRANSPORTS.map((item) =>
              item.value === Transport.car || item.value === Transport.ecar ? (
                <CarButton
                  key={item.value}
                  updateStep={updateStep}
                  isSelected={item.value === step.transportMean}
                  step={step}
                  icon={item.icon}
                  transport={item.value}
                />
              ) : (
                <TransportButton
                  key={item.value}
                  updateStep={() =>
                    updateStep(step.index, {
                      transportMean: item.value,
                      passengers: undefined,
                    })
                  }
                  isSelected={item.value === step.transportMean}
                  icon={item.icon}
                  transport={item.value}
                />
              ),
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
  icon: JSX.Element;
  transport: Transport.car | Transport.ecar;
}

const CarButton = ({
  updateStep,
  isSelected,
  step,
  icon,
  transport,
}: CarButtonProps) => {
  const { t } = useTranslation();
  const passergerChoices =
    transport === Transport.car ? [1, 2, 3, 4, 5, thumbUp] : [1, 2, 3, 4, 5];
  return (
    <Menu>
      <ChakraTooltip label={t(`form.transportMeans.${transport}`)}>
        <MenuButton position="relative">
          <TransportButton
            icon={icon}
            isSelected={isSelected}
            transport={transport}
          />
          {isSelected && step.passengers && (
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
        {passergerChoices.map((passengerNumber) => (
          <MenuItem
            key={passengerNumber}
            onClick={() =>
              updateStep(step.index, {
                transportMean: transport,
                passengers: passengerNumber,
              })
            }
          >
            {" "}
            {typeof passengerNumber !== "number"
              ? t("form.hitchHiking")
              : t("form.passengersNb", {
                  count: passengerNumber,
                })}
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
  transport: Transport;
}

const TransportButton = ({
  updateStep,
  isSelected,
  icon,
  transport,
}: TransportButtonProps) => {
  const { t } = useTranslation();
  return (
    <ChakraTooltip label={t(`form.transportMeans.${transport}`)}>
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
    </ChakraTooltip>
  );
};
