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

import React, { useRef } from "react";
import { MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, useBreakpointValue } from "@chakra-ui/react";

import { checkIsOnMobile } from "../../utils";
import { SimulationResults } from "../../types";
import Chart from "../chart";
import Legend from "./map-legend";
import MapContent from "./map-content";

type MapProps = {
  isDarkTheme: boolean;
  simulationResults?: SimulationResults;
  stepsCoords: [number, number][];
  alternativeStepsCoords: [number, number][];
};

const Map = ({
  isDarkTheme,
  simulationResults,
  stepsCoords,
  alternativeStepsCoords,
}: MapProps) => {
  const chartRef = useRef<null | HTMLDivElement>(null);
  const allowScrollToZoom = useBreakpointValue([false, true], { ssr: false });
  const isOnMobile = checkIsOnMobile();

  return (
    <>
      {!isOnMobile && simulationResults && (
        <Legend tripGeometries={simulationResults.tripGeometries} />
      )}
      <MapContainer
        center={[48, 10]}
        zoom={5}
        scrollWheelZoom={allowScrollToZoom}
        style={{ width: "100%", position: "relative" }}
      >
        <MapContent
          isDarkTheme={isDarkTheme}
          simulationResults={simulationResults}
          stepsCoords={stepsCoords}
          alternativeStepsCoords={alternativeStepsCoords}
        />
      </MapContainer>
      {simulationResults && isOnMobile && (
        <Card
          ref={chartRef}
          position="absolute"
          w={200}
          bottom={3}
          right={3}
          zIndex={2}
          p="10px"
          shadow="none"
        >
          <Chart
            trips={simulationResults.trips}
            simulationType={simulationResults.simulationType}
          />
        </Card>
      )}
    </>
  );
};

export default Map;
