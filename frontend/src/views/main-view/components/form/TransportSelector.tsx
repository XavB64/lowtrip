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

import { Text, Wrap } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  BiSolidBus,
  BiSolidCar,
  BiSolidPlaneAlt,
  BiSolidTrain,
} from "react-icons/bi";
import { FaFerry } from "react-icons/fa6";
import { IoMdBicycle } from "react-icons/io";
import { MdElectricCar, MdSailing } from "react-icons/md";

import Tooltip from "common/components/Tooltip";
import { Step, Transport } from "types";

import "./TransportSelector.scss";
import TransportWithOptions from "./TransportWithOptions";

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
    value: Transport.sail,
    icon: <MdSailing size={20} />,
  },
  {
    value: Transport.bicycle,
    icon: <IoMdBicycle size={20} />,
  },
];

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
          />
        ) : (
          <Tooltip
            key={item.value}
            content={t(`form.transportMeans.${item.value}`)}
            position="bottom"
          >
            <button
              className={`transport__button ${
                item.value === step.transportMean
                  ? "transport__button--selected"
                  : ""
              }`}
              onClick={() => {
                updateStep(step.index, {
                  transportMean: item.value,
                  passengers: undefined,
                });
              }}
            >
              <div className="transport__icon">{item.icon}</div>
            </button>
          </Tooltip>
        ),
      )}
    </Wrap>
  );
};

export default TransportSelector;
