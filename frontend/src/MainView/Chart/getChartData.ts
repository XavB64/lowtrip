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

import { Transport, Trip } from "types";

const getChartData = (
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

      let passengers: undefined | string | number;
      if (
        tripStep.transport === Transport.ecar ||
        tripStep.transport === Transport.car
      ) {
        if (tripStep.transport === Transport.car && tripStep.is_hitch_hike)
          passengers = tripStep.is_hitch_hike ? "👍" : tripStep.passengers_nb;
        else passengers = tripStep.passengers_nb;
      }
      const stepLabel = `${trip.label}__${index + 1}. ${t("chart.transportMeans." + tripStep.transport, { count: passengers })}`;

      for (const emissionPart of tripStep.emissionParts) {
        emissionPartLabel = `${stepLabel} - ${t("chart.category." + emissionPart.emissionSource, { defaultValue: emissionPart.emissionSource })}`;
        tripEmissionsByStep.set(emissionPartLabel, emissionPart.emissions);
        bars.push({
          emissionSource: emissionPartLabel,
          color: emissionPart.color,
        });
      }
    }

    chartData.push({
      displayedName: trip.label,
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

export default getChartData;
