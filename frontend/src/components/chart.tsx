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

import {
  Box,
  useBreakpoint,
  Tooltip as ChakraTooltip,
  Flex,
  useDisclosure,
  Text,
  Alert,
  AlertIcon,
  Link,
} from "@chakra-ui/react";
import { round } from "lodash";
import { BiHelpCircle } from "react-icons/bi";
import {
  Bar,
  BarChart,
  LabelList,
  LabelProps,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmissionsCategory, SimulationType, Transport, Trip } from "../types";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { NameType } from "recharts/types/component/DefaultTooltipContent";
import { useMemo } from "react";

/**
 * Corresponds to 2kg of CO2 emissions per year per person
 * in order to limit global warming to 1.5°C
 * See Paris Agreement and IPCC report
 */
const ANNUAL_CO2_EMISSIONS_BUDGET = 2000;

type ChartProps = {
  trips: Trip[];
  simulationType: SimulationType;
};

export const Chart = ({ trips, simulationType }: ChartProps) => {
  const { t } = useTranslation();
  const breakpoint = useBreakpoint();
  const { isOpen, onOpen, onToggle, onClose } = useDisclosure();

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
          emissionSource: emissionPart.emissionSource,
        })),
      );
      result.push({ trip, emissionParts });
      return result;
    },
    [] as {
      trip: Trip;
      emissionParts: { color: string; emissionSource: EmissionsCategory }[];
    }[],
  );

  return (
    <Box h="100%" w="100%">
      <Text mr={3} align="center" color="#595959" fontSize={["small", "large"]}>
        {chartTitle}
      </Text>
      <Alert
        status="info"
        my={3}
        borderRadius={5}
        fontSize={[8, 12]}
        p={[2, 3]}
      >
        <AlertIcon boxSize={[4, 5]} />
        <Text>
          {t("chart.information.info1")}{" "}
          <Text as="b">
            {round(
              (mainTrip.totalEmissions / ANNUAL_CO2_EMISSIONS_BUDGET) * 100,
            )}
            %
          </Text>{" "}
          {t("chart.information.your")}{" "}
          <Link
            href={t("chart.information.link")}
            isExternal
            textDecoration="underline"
          >
            {t("chart.information.info2")}
          </Link>{" "}
          {t("chart.information.info3")}
        </Text>
      </Alert>

      <ResponsiveContainer
        height={breakpoint === "base" ? 230 : 400}
        width="100%"
      >
        <BarChart data={chartData} margin={{ bottom: 0 }}>
          <XAxis
            dataKey="displayedName"
            fontSize={breakpoint === "base" ? 8 : 14}
          />
          <YAxis padding={{ top: 50 }} hide />
          <Tooltip
            formatter={(value, name) => [
              `${round(Number(value), 0)} kg`,
              getLabel(name, t),
            ]}
            contentStyle={{ fontSize: "12px" }}
          />
          {emissionPartsByTrip.map(({ trip, emissionParts }) =>
            emissionParts.map((emissionPart, index) => (
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
                      trip={trip}
                      isLastEmissionPart={index === emissionParts.length - 1}
                    />
                  }
                />
              </Bar>
            )),
          )}
        </BarChart>
      </ResponsiveContainer>

      <Flex justifyContent="flex-end" height="auto" width="100%">
        <ChakraTooltip
          label={t("results.explanation")}
          isOpen={isOpen}
          fontSize={10}
        >
          <span style={{ fontSize: breakpoint === "base" ? 8 : 12 }}>
            {" "}
            {t("chart.help")}
            <BiHelpCircle
              style={{ display: "inline-block", marginRight: "5px" }}
              onMouseEnter={onOpen}
              onMouseLeave={onClose}
              onClick={onToggle}
            />
          </span>
        </ChakraTooltip>
      </Flex>
    </Box>
  );
};

const getChartData = (
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

type CustomLabelProps = {
  trip: Trip;
  isLastEmissionPart: boolean;
} & LabelProps;

/** Only display the custom label of the last emission part of the trip */
const CustomLabel = ({
  trip,
  isLastEmissionPart,
  ...props
}: CustomLabelProps) => {
  const breakpoint = useBreakpoint();

  const shouldDisplay = trip.label === props.value && isLastEmissionPart;
  if (!shouldDisplay) return null;

  return (
    <>
      <text
        x={Number(props.x ?? 0) + Number(props.width ?? 0) / 2}
        y={Number(props.y ?? 0) - (breakpoint === "base" ? 15 : 20)}
        textAnchor="middle"
        fontSize={breakpoint === "base" ? 10 : 16}
      >
        {round(trip.totalEmissions)}
      </text>
      <text
        x={Number(props.x ?? 0) + Number(props.width ?? 0) / 2}
        y={Number(props.y ?? 0) - 5}
        textAnchor="middle"
        fontSize={breakpoint === "base" ? 8 : 12}
      >
        kgCO2eq
      </text>
    </>
  );
};

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

function getLabel(name: NameType, t: TFunction<"translation", undefined>) {
  return name
    .toString()
    .split(" ")
    .map((substring) => {
      const transport = transportMeansMapper[substring];
      const category = categoryMapper[substring];
      return t(transport ?? category ?? substring);
    })
    .join(" ");
}

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
