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

import { NameType } from "recharts/types/component/DefaultTooltipContent";
import { EmissionsCategory, Transport, Trip } from "../../types";
import { TFunction } from "i18next";

const transportMeansMapper: Record<Transport | string, string> = {
  [Transport.plane]: "chart.transportMeans.plane",
  [Transport.car]: "chart.transportMeans.car",
  [Transport.ecar]: "chart.transportMeans.ecar",
  [Transport.bus]: "chart.transportMeans.bus",
  [Transport.train]: "chart.transportMeans.train",
  [Transport.ferry]: "chart.transportMeans.ferry",
  [Transport.bicycle]: "chart.transportMeans.bicycle",
  [Transport.sail]: "chart.transportMeans.sail",
  [Transport.myTrip]: "chart.transportMeans.myTrip",
  [Transport.otherTrip]: "chart.transportMeans.otherTrip",
};

const categoryMapper: Record<EmissionsCategory | string, string> = {
  [EmissionsCategory.infra]: "chart.category.infra",
  [EmissionsCategory.construction]: "chart.category.construction",
  [EmissionsCategory.fuel]: "chart.category.fuel",
  [EmissionsCategory.kerosene]: "chart.category.kerosene",
  [EmissionsCategory.contrails]: "chart.category.contrails",
  [EmissionsCategory.bikeBuild]: "chart.category.bikeBuild",
  [EmissionsCategory.none]: "form.ferryNone",
  [EmissionsCategory.cabin]: "form.ferryCabin",
  [EmissionsCategory.vehicle]: "form.ferryVehicle",
  [EmissionsCategory.cabinvehicle]: "form.ferryCabinVehicle",
};

export const getLabel = (
  name: NameType,
  t: TFunction<"translation", undefined>,
) => {
  return name
    .toString()
    .split(" ")
    .map((substring) => {
      const transport = transportMeansMapper[substring];
      const category = categoryMapper[substring];
      return t(transport ?? category ?? substring);
    })
    .join(" ");
};

export const getChartData = (
  trips: Trip[],
  t: TFunction<"translation", undefined>,
) => {
  return trips.map((trip) => {
    const tripEmissionsByStep = trip.steps.reduce(
      (acc, tripStep) => {
        tripStep.emissionParts.forEach((emissionPart) => {
          acc[emissionPart.emissionSource] = emissionPart.emissions;
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      displayedName: getLabel(trip.label, t),
      name: trip.label,
      ...tripEmissionsByStep,
    };
  });
};
