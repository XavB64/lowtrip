// lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

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

import { useBreakpoint } from "@chakra-ui/react";
import { round } from "lodash";
import { LabelProps } from "recharts";
import type { Trip } from "../../../../types";

type CustomLabelProps = {
  emissionPartsByTrip: {
    trip: Trip;
    emissionParts: { color: string; emissionSource: string }[];
  }[];
  emissionSource: string;
} & LabelProps;

/** Only display the custom label of the last emission part of the trip */
const CustomLabel = ({
  emissionPartsByTrip,
  emissionSource,
  ...props
}: CustomLabelProps) => {
  const breakpoint = useBreakpoint();

  const { emissionParts, trip } = emissionPartsByTrip.find(
    ({ trip }) => trip.label === props.value,
  ) as {
    trip: Trip;
    emissionParts: { color: string; emissionSource: string }[];
  };

  const shouldDisplay =
    emissionParts.slice(-1)[0].emissionSource === emissionSource;
  if (!shouldDisplay) return null;

  return (
    <>
      <text
        x={Number(props.x ?? 0) + Number(props.width ?? 0) / 2}
        y={Number(props.y ?? 0) - (breakpoint === "base" ? 15 : 20)}
        textAnchor="middle"
        fontSize={breakpoint === "base" ? 10 : 16}
      >
        {round(trip.totalEmissions)}
      </text>
      <text
        x={Number(props.x ?? 0) + Number(props.width ?? 0) / 2}
        y={Number(props.y ?? 0) - 5}
        textAnchor="middle"
        fontSize={breakpoint === "base" ? 8 : 12}
      >
        kgCO2eq
      </text>
    </>
  );
};

export default CustomLabel;
