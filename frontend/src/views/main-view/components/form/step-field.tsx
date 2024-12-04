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
import { BiTrash } from "react-icons/bi";

import TransportSelector from "./transport-selector";
import { HStack, IconButton } from "@chakra-ui/react";
import { Step } from "../../types";
import CityDropdown from "./city-dropdown";
import { City } from "./types";

type StepFieldProps = {
  removeStep: (index: number) => void;
  updateStep: (index: number, data: Partial<Step>) => void;
  step: Step;
};

export const StepField = ({ removeStep, updateStep, step }: StepFieldProps) => {
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
        <TransportSelector step={step} updateStep={updateStep} />
      )}
    </>
  );
};
