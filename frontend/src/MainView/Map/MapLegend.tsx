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

import { useTranslation } from "react-i18next";

import type { SimulationResults } from "types";
import { uniqBy } from "utils";

const Legend = ({
  tripGeometries,
}: {
  tripGeometries: SimulationResults["tripGeometries"];
}) => {
  const { t } = useTranslation();
  const routes = useMemo(
    () => uniqBy(tripGeometries, "transportMeans"),
    [tripGeometries],
  );

  return (
    <div className="map-legend-card">
      {routes.map((route) => (
        <div key={route.transportMeans} className="legend-row">
          <div
            className="legend-color"
            style={{ backgroundColor: route.color }}
          />
          <span>{t(`chart.paths.${route.transportMeans.toLowerCase()}`)}</span>
        </div>
      ))}
    </div>
  );
};

export default Legend;
