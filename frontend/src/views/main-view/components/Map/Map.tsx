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

import { useMemo } from "react";

import { MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { useSimulationContext } from "common/context/simulationContext";
import { checkIsOnMobile } from "common/utils";
import type { Step } from "types";

import MapContent from "./MapContent";
import Legend from "./MapLegend";
import "./Map.scss";

const extractCoords = (steps?: Step[]) =>
  (steps || [])
    .filter((step) => !!step.locationCoords)
    .map((step) => step.locationCoords as [number, number]);

type MapProps = {
  isDarkTheme: boolean;
};

const Map = ({ isDarkTheme }: MapProps) => {
  const isOnMobile = checkIsOnMobile();

  const { steps, alternativeSteps, simulationResults } = useSimulationContext();

  const stepsCoords = useMemo(() => extractCoords(steps), [steps]);

  const alternativeStepsCoords = useMemo(
    () => extractCoords(alternativeSteps),
    [alternativeSteps],
  );

  return (
    <div className="map-container">
      {simulationResults && (
        <Legend tripGeometries={simulationResults.tripGeometries} />
      )}
      <MapContainer
        center={[48, 10]}
        zoom={5}
        scrollWheelZoom={!isOnMobile}
        style={{ width: "100%", height: "100%", position: "relative" }}
      >
        <MapContent
          isDarkTheme={isDarkTheme}
          simulationResults={simulationResults}
          stepsCoords={stepsCoords}
          alternativeStepsCoords={alternativeStepsCoords}
        />
      </MapContainer>
    </div>
  );
};

export default Map;
