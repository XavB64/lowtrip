// // Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// // Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// // This program is free software: you can redistribute it and/or modify
// // it under the terms of the GNU General Public License as published by
// // the Free Software Foundation, either version 3 of the License, or
// // (at your option) any later version.

// // This program is distributed in the hope that it will be useful,
// // but WITHOUT ANY WARRANTY; without even the implied warranty of
// // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// // GNU General Public License for more details.

// // You should have received a copy of the GNU General Public License
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
import { Box, HStack, Text, useBreakpointValue } from "@chakra-ui/react";
import { markerIcon } from "../assets/marker-icon";

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
    <MapContainer
      center={[48, 10]}
      zoom={5}
      scrollWheelZoom={allowScrollToZoom}
      style={{ width: "100%" }}
    >
      <MapContent
        isDarkTheme={isDarkTheme}
        response={response}
        stepsCoords={stepsCoords}
        alternativeStepsCoords={alternativeStepsCoords}
      />
    </MapContainer>
  );
};

const MapContent = ({
  isDarkTheme,
  response,
  stepsCoords,
  alternativeStepsCoords,
}: MapProps) => {
  const map = useMap();

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
                    <Text>{feature.properties["label"]}</Text>
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
