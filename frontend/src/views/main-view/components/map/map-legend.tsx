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

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { uniqBy } from "lodash";
import { Box, Card, HStack, Text, VStack } from "@chakra-ui/react";

import { SimulationResults } from "../../types";
import { pathMapper } from "./const";

const Legend = ({
  tripGeometries,
}: {
  tripGeometries: SimulationResults["tripGeometries"];
}) => {
  const { t } = useTranslation();
  const trips = useMemo(
    () => uniqBy(tripGeometries, (trip) => trip.label),
    [tripGeometries],
  );

  return (
    <Card display="flex" position="absolute" zIndex={2} top={5} right={5} p={3}>
      <VStack align="start">
        {trips.map((trip) => (
          <HStack key={trip.label}>
            <Box w={5} h={3} backgroundColor={trip.color} />
            <Text fontSize="sm">{t(pathMapper[trip.label])}</Text>
          </HStack>
        ))}
      </VStack>
    </Card>
  );
};

export default Legend;
