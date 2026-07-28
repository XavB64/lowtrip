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

import type { SimulationResults } from "types";

type LegendProps = {
  routes: SimulationResults["mapLegends"];
};

const Legend = ({ routes }: LegendProps) => (
  <div className="map-legend-card">
    {routes.map((route) => (
      <div key={route.label} className="legend-row">
        <div
          className="legend-color"
          style={{ backgroundColor: route.color }}
        />
        <span>{route.label}</span>
      </div>
    ))}
  </div>
);

export default Legend;
