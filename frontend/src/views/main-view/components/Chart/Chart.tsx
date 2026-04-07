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

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";
import { BiHelpCircle, BiInfoCircle } from "react-icons/bi";
import { FaShareAlt } from "react-icons/fa";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import Tooltip from "common/components/Tooltip";
import { checkIsOnMobile, uniqBy } from "common/utils";
import type { Trip, SimulationResults } from "types";

import CustomLabel from "./CustomLabel";
import { getChartData, getLabel } from "./helpers";
import { generateUrlToShare } from "../../helpers/shareableLink";
import "./Chart.scss";

/**
 * Corresponds to 2kg of CO2 emissions per year per person
 * in order to limit global warming to 1.5°C
 * See Paris Agreement and IPCC report
 */
const ANNUAL_CO2_EMISSIONS_BUDGET = 2000;

type ChartProps = {
  simulationResults: SimulationResults;
};

const Chart = ({
  simulationResults: { trips, simulationType, inputs },
}: ChartProps) => {
  const { t } = useTranslation();

  const [showCopiedLinkNotification, setShowCopiedLinkNotification] =
    useState(false);

  const mainTrip = trips.find((trip) => trip.isMainTrip) as Trip;

  const chartTitle = useMemo(() => {
    if (simulationType === "mainTripVsOtherTrip") {
      return t("results.vsOtherTrip");
    }
    if (simulationType === "mainTripVsOtherTransportMeans") {
      return t("results.vsOtherMeans");
    }
    return t("results.yourTripEmissions");
  }, [simulationType, t]);

  const chartData = useMemo(() => getChartData(trips, t), [trips, t]);

  const emissionPartsByTrip = trips.reduce(
    (result, trip) => {
      const emissionParts = trip.steps.flatMap((step) =>
        step.emissionParts.map((emissionPart) => ({
          color: emissionPart.color,
          emissionSource: `${emissionPart.emissionSource} ${trip.isMainTrip ? "" : " "}`,
        })),
      );
      result.push({ trip, emissionParts });
      return result;
    },
    [] as {
      trip: Trip;
      emissionParts: { color: string; emissionSource: string }[];
    }[],
  );

  const bars = useMemo(
    () =>
      uniqBy(
        trips.flatMap((trip) =>
          trip.steps.flatMap((step) =>
            step.emissionParts.flatMap((emissionPart) => ({
              color: emissionPart.color,
              emissionSource: `${emissionPart.emissionSource} ${trip.isMainTrip ? "" : " "}`,
            })),
          ),
        ),
        "emissionSource",
      ),
    [trips],
  );

  return (
    <div className="chart-container">
      <div className="chart-title">
        {chartTitle}

        <button
          className="share-icon-button"
          onClick={() =>
            generateUrlToShare(inputs, setShowCopiedLinkNotification)
          }
          aria-label="share"
        >
          <FaShareAlt size={15} />
        </button>

        {showCopiedLinkNotification && (
          <div className="copied-toast">{t("chart.copied-link")}</div>
        )}
      </div>

      <div className="alert">
        <BiInfoCircle className="alert-icon-svg" />
        <span>
          {t("chart.information.info1")}{" "}
          <strong>
            {Math.round(
              (mainTrip.totalEmissions / ANNUAL_CO2_EMISSIONS_BUDGET) * 100,
            )}
            %
          </strong>{" "}
          {t("chart.information.your")}{" "}
          <a
            href={t("chart.information.link")}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("chart.information.info2")}
          </a>{" "}
          {t("chart.information.info3")}
        </span>
      </div>

      <ResponsiveContainer height={checkIsOnMobile() ? 230 : 400} width="100%">
        <BarChart data={chartData} margin={{ bottom: 0 }}>
          <XAxis
            dataKey="displayedName"
            fontSize={checkIsOnMobile() ? 8 : 14}
          />
          <YAxis padding={{ top: 50 }} hide />
          <ChartTooltip
            formatter={(value, name) => [
              `${Math.round(Number(value))} kg`,
              getLabel(String(name ?? ""), t),
            ]}
            contentStyle={{ fontSize: "12px" }}
          />
          {bars.map((emissionPart) => (
            <Bar
              key={emissionPart.emissionSource}
              dataKey={emissionPart.emissionSource}
              fill={emissionPart.color}
              stackId="a"
            >
              <LabelList
                dataKey="name"
                content={
                  <CustomLabel
                    emissionPartsByTrip={emissionPartsByTrip}
                    emissionSource={emissionPart.emissionSource}
                  />
                }
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div className="chart-footer">
        <Tooltip content={t("results.explanation")}>
          <div className="plane-explanation-tooltip">
            {t("chart.help")}
            <BiHelpCircle className="help-icon" />
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default Chart;
