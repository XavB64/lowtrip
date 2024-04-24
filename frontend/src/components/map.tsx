// // Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// // Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// // This program is free software: you can redistribute it and/or modify
// // it under the terms of the GNU Affero General Public License as published
// // by the Free Software Foundation, either version 3 of the License, or
// // (at your option) any later version.

// // This program is distributed in the hope that it will be useful,
// // but WITHOUT ANY WARRANTY; without even the implied warranty of
// // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// // GNU Affero General Public License for more details.

// // You should have received a copy of the GNU Affero General Public License
// // along with this program.  If not, see <https://www.gnu.org/licenses/>.

import React, { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ApiResponse, Gdf } from "../types";
import {
  Box,
  Card,
  HStack,
  Text,
  VStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { markerIcon } from "../assets/marker-icon";
import { useTranslation } from "react-i18next";
import { uniqBy } from "lodash";

interface MapProps {
  isDarkTheme: boolean;
  response?: ApiResponse;
  stepsCoords: [number, number][];
  alternativeStepsCoords: [number, number][];
}

export const Map = ({
  isDarkTheme,
  response,
  stepsCoords,
  alternativeStepsCoords,
}: MapProps) => {
  const allowScrollToZoom = useBreakpointValue([false, true], { ssr: false });

  return (
    <>
      <Legend response={response} />
      <MapContainer
        center={[48, 10]}
        zoom={5}
        scrollWheelZoom={allowScrollToZoom}
        style={{ width: "100%", position: "relative" }}
      >
        <MapContent
          isDarkTheme={isDarkTheme}
          response={response}
          stepsCoords={stepsCoords}
          alternativeStepsCoords={alternativeStepsCoords}
        />
      </MapContainer>
    </>
  );
};

const MapContent = ({
  isDarkTheme,
  response,
  stepsCoords,
  alternativeStepsCoords,
}: MapProps) => {
  const map = useMap();
  const { t } = useTranslation();

  const theme = useMemo(
    () => (isDarkTheme ? "dark_all" : "rastertiles/voyager"),
    [isDarkTheme]
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
      {response &&
        (JSON.parse(response.data.gdf) as Gdf).features.map((feature) => {
          return (
            <>
              <Polyline
                key={`${JSON.stringify(feature.geometry.coordinates)}bis`}
                pathOptions={{ color: feature.properties.colors, opacity: 0.9 }}
                positions={feature.geometry.coordinates.map((coordinate) => [
                  coordinate[1],
                  coordinate[0],
                ])}
              />
              <Polyline
                key={JSON.stringify(feature.geometry.coordinates)}
                pathOptions={{ opacity: 0, weight: 20 }}
                positions={feature.geometry.coordinates.map((coordinate) => [
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
                      bgColor={feature.properties.colors}
                    />
                    <Text>
                      {t(pathMapper[feature.properties["label"]])} :{" "}
                      {feature.properties.length}
                    </Text>
                  </HStack>
                </Tooltip>
              </Polyline>
            </>
          );
        })}
      {stepsCoords.map((coords, index) => (
        <Marker
          key={index}
          position={coords}
          icon={markerIcon(
            index === 0 || index === stepsCoords.length - 1
              ? "#0097A7"
              : "#93D3DB"
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
              : "#FFBBC7"
          )}
        />
      ))}
    </>
  );
};

const Legend = ({ response }: { response?: ApiResponse }) => {
  const { t } = useTranslation();
  if (!response) return null;
  return (
    <Card
      display={["none", "none", "flex"]}
      position="absolute"
      zIndex={2}
      top={5}
      right={5}
      p={3}
    >
      <VStack align="start">
        {uniqBy(
          (JSON.parse(response.data.gdf) as Gdf).features,
          (feature) => feature.properties.label
        ).map((feature) => (
          <HStack key={feature.properties.label}>
            <Box w={5} h={3} backgroundColor={feature.properties.colors} />
            <Text fontSize="sm">
              {t(pathMapper[feature.properties["label"]])}
            </Text>
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
};
