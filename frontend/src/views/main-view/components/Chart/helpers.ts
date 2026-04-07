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

import { TFunction } from "i18next";

import { EmissionsCategory, Transport, Trip } from "types";

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

const getLabel = (name: string, t: TFunction<"translation", undefined>) => {
  if (name.includes("Direct trip")) {
    const nameParts = name.split(" ");
    if (nameParts.length < 3) {
      console.error("Failed to parse trip name: ", name);
      return name;
    }
    const transport = nameParts[2] as Transport;
    if ([Transport.car, Transport.ecar].includes(transport)) {
      return `${t("chart.transportMeans.car")} ${nameParts[3]}`;
    }

    return t(transportMeansMapper[transport]);
  }

  return name
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
  const chartData = [];
  const lastEmissionSourceByTrip: {
    tripLabel: string;
    totalEmissions: number;
    lastEmissionSource: string;
  }[] = [];
  const bars = [];

  for (const trip of trips) {
    const tripEmissionsByStep = new Map<string, number>();
    let emissionPartLabel: string;

    for (let index = 0; index < trip.steps.length; index++) {
      const tripStep = trip.steps[index];
      const stepLabel = `${trip.label}__${index + 1}. ${t(transportMeansMapper[tripStep.transportMeans], { count: tripStep.passengers })}`;

      for (const emissionPart of tripStep.emissionParts) {
        emissionPartLabel = `${stepLabel} - ${t(categoryMapper[emissionPart.emissionSource]) || emissionPart.emissionSource}`;
        tripEmissionsByStep.set(emissionPartLabel, emissionPart.emissions);
        bars.push({
          emissionSource: emissionPartLabel,
          color: emissionPart.color,
        });
      }
    }

    chartData.push({
      displayedName: getLabel(trip.label, t),
      name: trip.label,
      ...Object.fromEntries(tripEmissionsByStep),
    });
    lastEmissionSourceByTrip.push({
      tripLabel: trip.label,
      totalEmissions: trip.totalEmissions,
      lastEmissionSource: emissionPartLabel!,
    });
  }

  return { chartData, bars, lastEmissionSourceByTrip };
};
