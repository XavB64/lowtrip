// // lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

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
import { round, sumBy, uniq, uniqBy } from "lodash";
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
import { ApiResponse, EmissionsCategory, Transport, TripData } from "../types";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { NameType } from "recharts/types/component/DefaultTooltipContent";

interface ChartProps {
  response?: ApiResponse;
}

export function Chart({ response }: ChartProps) {
  const { t } = useTranslation();
  const breakpoint = useBreakpoint();
  const { isOpen, onOpen, onToggle, onClose } = useDisclosure();

  if (!response) return null;

  const trips: TripData[] = [
    ...JSON.parse(response.data.my_trip ?? {}),
    ...(response.data.direct_trip ? JSON.parse(response.data.direct_trip) : []),
    ...(response.data.alternative_trip
      ? JSON.parse(response.data.alternative_trip)
      : []),
  ];
  const myTripEmissions = sumBy(
    JSON.parse(response.data.my_trip ?? {}) as TripData[],
    (trip) => trip.kgCO2eq
  );

  return (
    <Box h="100%" w="100%">
      <Text mr={3} align="center" color="#595959" fontSize={["small", "large"]}>
        {response.data.alternative_trip
          ? t("results.vsOtherTrip")
          : response.data.direct_trip
          ? t("results.vsOtherMeans")
          : t("results.yourTripEmissions")}
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
          {t("chart.information.info_1")}{" "}
          <Text as="b">{round((myTripEmissions * 100) / 2000)}%</Text>{" "}{t("chart.information.your")}{" "}
          <Link
            href={t("chart.information.link")}
            isExternal
            textDecoration="underline"
          >
            {t("chart.information.info_2")}
          </Link>{" "}
          {t("chart.information.info_3")}
        </Text>
      </Alert>
      <ResponsiveContainer
        height={breakpoint === "base" ? 230 : 350}
        width="100%"
      >
        <BarChart data={getChartData(trips, t)} margin={{ bottom: 0 }}>
          <XAxis
            dataKey="displayedName"
            fontSize={breakpoint === "base" ? 8 : 14}
          />
          <YAxis padding={{ top: 30 }} hide />
          <Tooltip
            formatter={(value, name) => [
              `${round(Number(value), 0)} kg`,
              getLabel(name, t),
            ]}
            contentStyle={{ fontSize: "12px" }}
          />
          {uniqBy(trips, "NAME").map((trip) => (
            <Bar
              key={trip.NAME}
              dataKey={trip.NAME}
              fill={trip.colors}
              stackId="a"
            >
              <LabelList
                dataKey="name"
                content={<CustomLabel trips={trips} tripName={trip.NAME} />}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>

      <Flex justifyContent="flex-end" height="auto" width="100%">
        <ChakraTooltip
          label={t("results.explanation")}
          isOpen={isOpen}
          fontSize={10}
        >
          <span style={{fontSize: breakpoint === "base" ? 8 : 12}}> {t("chart.help")}
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
}

function getChartData(
  trips: TripData[],
  t: TFunction<"translation", undefined>
) {
  const transports = uniq(
    trips.map((tripData) => tripData["Mean of Transport"])
  );

  return transports.map((transport) => {
    const result: { [key: string]: string | number } = {
      name: transport,
      displayedName: getLabel(transport, t),
    };
    if ((transport as string) === "Alternative") {
      result.displayedName = "Other";
    }
    trips.forEach((trip) => {
      if (trip["Mean of Transport"] === transport)
        result[trip.NAME] = trip.kgCO2eq;
    });
    return result;
  });
}

interface CustomLabelProps extends LabelProps {
  trips: TripData[];
  tripName: string;
}

const CustomLabel = ({ trips, tripName, ...props }: CustomLabelProps) => {
  const breakpoint = useBreakpoint();
  const currentTrips = trips.filter(
    (trip) => trip["Mean of Transport"] === props.value
  );
  const total = sumBy(currentTrips, "kgCO2eq");
  const shouldDisplay = currentTrips[currentTrips.length - 1].NAME === tripName;

  if (!shouldDisplay) return null;

  return (
    <>
      <text
        x={Number(props.x ?? 0) + Number(props.width ?? 0) / 2}
        y={Number(props.y ?? 0) - (breakpoint === "base" ? 15 : 20)}
        textAnchor="middle"
        fontSize={breakpoint === "base" ? 10 : 16}
      >
        {round(total)}
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
};
