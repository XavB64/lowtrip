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

import {
  BiSolidBus,
  BiSolidCar,
  BiSolidPlaneAlt,
  BiSolidTrain,
} from "react-icons/bi";
import { FaFerry } from "react-icons/fa6";
import { MdElectricCar } from "react-icons/md";
import { IoMdBicycle } from "react-icons/io";
import { Step, Transport, thumbUp } from "../../types";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tooltip,
} from "@chakra-ui/react";

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

type CarButtonProps = {
  updateStep: (index: number, data: Partial<Step>) => void;
  isSelected: boolean;
  step: Step;
  icon: JSX.Element;
  transport: Transport.car | Transport.ecar;
};

const CarButton = ({
  updateStep,
  isSelected,
  step,
  icon,
  transport,
}: CarButtonProps) => {
  const { t } = useTranslation();
  const passergerChoices: (number | typeof thumbUp)[] =
    transport === Transport.car ? [1, 2, 3, 4, 5, thumbUp] : [1, 2, 3, 4, 5];
  return (
    <Menu>
      <Tooltip label={t(`form.transportMeans.${transport}`)}>
        <MenuButton position="relative">
          <Tooltip label={t(`form.transportMeans.${transport}`)}>
            <Box
              alignItems={"center"}
              justifyContent={"center"}
              display="flex"
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
            </Box>
          </Tooltip>
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
      </Tooltip>
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

type TransportButtonProps = {
  updateStep?: () => void;
  isSelected: boolean;
  icon: JSX.Element;
  transport: Transport;
};

const TransportButton = ({
  updateStep,
  isSelected,
  icon,
  transport,
}: TransportButtonProps) => {
  const { t } = useTranslation();
  return (
    <Tooltip label={t(`form.transportMeans.${transport}`)}>
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
    </Tooltip>
  );
};

const TransportSelector = ({
  updateStep,
  step,
}: {
  updateStep: (index: number, data: Partial<Step>) => void;
  step: Step;
}) => {
  const { t } = useTranslation();

  return (
    <HStack direction="row" marginBottom={2} marginTop={1} gap={0}>
      <span style={{ paddingRight: 5, textAlign: "end" }}>{t("form.by")}</span>
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
    </HStack>
  );
};

export default TransportSelector;
