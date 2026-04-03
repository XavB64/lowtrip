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

import { IconButton } from "common/components/Button";
import Tooltip from "common/components/Tooltip";
import { Step, Transport } from "types";

import "./TransportSelector.scss";
import TransportWithOptions from "./TransportWithOptions";

const TRANSPORTS = [
  {
    transport: Transport.train,
    icon: <BiSolidTrain size={20} />,
  },
  {
    transport: Transport.plane,
    icon: <BiSolidPlaneAlt size={20} />,
  },
  {
    transport: Transport.bus,
    icon: <BiSolidBus size={20} />,
  },
  {
    transport: Transport.car,
    icon: <BiSolidCar size={20} />,
  },
  {
    transport: Transport.ecar,
    icon: <MdElectricCar size={20} />,
  },
  {
    transport: Transport.ferry,
    icon: <FaFerry size={20} />,
  },
  {
    transport: Transport.sail,
    icon: <MdSailing size={20} />,
  },
  {
    transport: Transport.bicycle,
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
    <div className="transport-selector-section">
      <p>{t("form.by")}</p>

      {TRANSPORTS.map(({ transport, icon }) =>
        transport === Transport.ferry ||
        transport === Transport.car ||
        transport === Transport.ecar ? (
          <TransportWithOptions
            key={transport}
            updateStep={updateStep}
            isSelected={transport === step.transportMean}
            step={step}
            icon={icon}
            transport={transport}
          />
        ) : (
          <Tooltip
            key={transport}
            content={t(`form.transportMeans.${transport}`)}
            position="bottom"
          >
            <IconButton
              icon={icon}
              className={`transport__button ${
                transport === step.transportMean ? "selected" : ""
              }`}
              onClick={() => {
                updateStep(step.index, {
                  transportMean: transport,
                  passengers: undefined,
                });
              }}
            />
          </Tooltip>
        ),
      )}
    </div>
  );
};

export default TransportSelector;
