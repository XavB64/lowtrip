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

import React, { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { uniqBy } from "lodash";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Box,
  Card,
  HStack,
  Text,
  VStack,
  useBreakpointValue,
} from "@chakra-ui/react";

import { markerIcon } from "../assets/marker-icon";
import { checkIsOnMobile } from "../utils";
import { SimulationResults } from "../types";
import { Chart } from "./chart";

interface MapProps {
  isDarkTheme: boolean;
  simulationResults?: SimulationResults;
  stepsCoords: [number, number][];
  alternativeStepsCoords: [number, number][];
}

export const Map = ({
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

const MapContent = ({
  isDarkTheme,
  simulationResults: simulationResults,
  stepsCoords,
  alternativeStepsCoords,
}: MapProps) => {
  const map = useMap();
  const { t } = useTranslation();

  const tripGeometries = simulationResults?.tripGeometries;

  const theme = useMemo(
    () => (isDarkTheme ? "dark_all" : "rastertiles/voyager"),
    [isDarkTheme],
  );

  useEffect(() => {
    const allCoords = [...stepsCoords, ...alternativeStepsCoords];
    if (allCoords.length > 1) {
      const lats = allCoords.map((coords) => coords[0]);
      const lons = allCoords.map((coords) => coords[1]);
      const maxLat = Math.max(...lats);
      const minLat = Math.min(...lats);
      const maxLng = Math.max(...lons);
      const minLng = Math.min(...lons);
      map.flyToBounds([
        [minLat, minLng],
        [maxLat, maxLng],
      ]);
    }
  }, [map, stepsCoords, alternativeStepsCoords]);

  return (
    <>
      <TileLayer
        url={`https://a.basemaps.cartocdn.com/${theme}/{z}/{x}/{y}@2x.png`}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {tripGeometries &&
        tripGeometries.map((tripGeometry) => (
          <React.Fragment key={JSON.stringify(tripGeometry.coordinates)}>
            <Polyline
              pathOptions={{ color: tripGeometry.color, opacity: 0.9 }}
              positions={tripGeometry.coordinates.map((coordinate) => [
                coordinate[1],
                coordinate[0],
              ])}
            />
            <Polyline
              pathOptions={{ opacity: 0, weight: 20 }}
              positions={tripGeometry.coordinates.map((coordinate) => [
                coordinate[1],
                coordinate[0],
              ])}
            >
              <Tooltip sticky>
                <HStack>
                  <Box
                    h={2}
                    w={2}
                    borderRadius={2}
                    bgColor={tripGeometry.color}
                  />
                  <Text>
                    {t(pathMapper[tripGeometry.label])} : {tripGeometry.length}
                  </Text>
                </HStack>
              </Tooltip>
            </Polyline>
          </React.Fragment>
        ))}
      {stepsCoords.map((coords, index) => (
        <Marker
          key={index}
          position={coords}
          icon={markerIcon(
            index === 0 || index === stepsCoords.length - 1
              ? "#0097A7"
              : "#93D3DB",
          )}
        />
      ))}
      {alternativeStepsCoords.map((coords, index) => (
        <Marker
          key={index}
          position={coords}
          icon={markerIcon(
            index === 0 || index === alternativeStepsCoords.length - 1
              ? "#FF758F"
              : "#FFBBC7",
          )}
        />
      ))}
    </>
  );
};

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

const pathMapper: Record<string, string> = {
  Railway: "chart.paths.railway",
  Road: "chart.paths.road",
  Bike: "chart.paths.bike",
  Flight: "chart.paths.flight",
  Ferry: "chart.paths.ferry",
  Sail: "chart.paths.sail",
};
