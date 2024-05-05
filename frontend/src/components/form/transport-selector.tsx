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
import { Step, Transport, FerryOptions, thumbUp } from "../../types";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tooltip,
  Text,
  Wrap,
  Center,
} from "@chakra-ui/react";
import { TFunction } from "i18next";

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

const getTransportOptions = (
  transport: Transport.ecar | Transport.car | Transport.ferry,
  t: TFunction,
): { label: string; stepOptions: Partial<Step> }[] => {
  if (transport === Transport.ferry) {
    return [
      {
        label: t("form.ferryNone"),
        stepOptions: {
          options: FerryOptions.none,
          passengers: undefined,
        },
      },
      {
        label: t("form.ferryCabin"),
        stepOptions: {
          options: FerryOptions.cabin,
          passengers: undefined,
        },
      },
      {
        label: t("form.ferryVehicle"),
        stepOptions: {
          options: FerryOptions.vehicle,
          passengers: undefined,
        },
      },
      {
        label: t("form.ferryCabinVehicle"),
        stepOptions: {
          options: FerryOptions.cabinVehicle,
          passengers: undefined,
        },
      },
    ];
  }
  const basicCarOptions = [1, 2, 3, 4, 5, 6, 7].map((count) => ({
    label: t("form.passengersNb", { count }),
    stepOptions: { passengers: count, options: undefined },
  }));
  return transport === Transport.car
    ? [
        ...basicCarOptions,
        {
          label: t("form.hitchHiking"),
          stepOptions: { passengers: thumbUp, options: undefined },
        },
      ]
    : basicCarOptions;
};

function getIcon(step: Step) {
  if (step.passengers) return step.passengers;
  if (step.options) {
    switch (step.options) {
      case FerryOptions.none:
        return "💺";
      case FerryOptions.cabin:
        return "🏠";
      case FerryOptions.vehicle:
        return "🚗";
      case FerryOptions.cabinVehicle:
        return "🏰";
    }
  }
  return "";
}

const TransportButtonBaseStyle = {
  padding: 0,
  width: "30px",
  minWidth: "30px",
  height: "30px",
  borderRadius: "100px",
  color: "white",
};

type TransportWithOptionsProps = {
  updateStep: (index: number, data: Partial<Step>) => void;
  isSelected: boolean;
  step: Step;
  icon: JSX.Element;
  transport: Transport.car | Transport.ecar | Transport.ferry;
  options: { label: string; stepOptions: Partial<Step> }[];
};

const TransportWithOptions = ({
  updateStep,
  isSelected,
  step,
  icon,
  transport,
  options,
}: TransportWithOptionsProps) => {
  const { t } = useTranslation();
  return (
    <Menu>
      <Tooltip label={t(`form.transportMeans.${transport}`)}>
        <MenuButton position="relative">
          <Tooltip label={t(`form.transportMeans.${transport}`)}>
            <Center
              {...TransportButtonBaseStyle}
              backgroundColor={isSelected ? "#474747" : "#b7b7b7"}
            >
              {icon}
            </Center>
          </Tooltip>
          {isSelected && (
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
              {getIcon(step)}
            </Box>
          )}
        </MenuButton>
      </Tooltip>
      <MenuList zIndex={3}>
        {options.map((option) => (
          <MenuItem
            key={option.label}
            onClick={() =>
              updateStep(step.index, {
                transportMean: transport,
                ...option.stepOptions,
              })
            }
          >
            {option.label}
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
        {...TransportButtonBaseStyle}
        backgroundColor={isSelected ? "#474747" : "#b7b7b7"}
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
    <Wrap direction="row" marginBottom={2} marginTop={1} spacing={[1, 2]}>
      <Text>{t("form.by")}</Text>
      {TRANSPORTS.map((item) =>
        item.value === Transport.ferry ||
        item.value === Transport.car ||
        item.value === Transport.ecar ? (
          <TransportWithOptions
            key={item.value}
            updateStep={updateStep}
            isSelected={item.value === step.transportMean}
            step={step}
            icon={item.icon}
            transport={item.value}
            options={getTransportOptions(item.value, t)}
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
    </Wrap>
  );
};

export default TransportSelector;
