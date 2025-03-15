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
  IconButton,
} from "@chakra-ui/react";
import { round, uniqBy } from "lodash";
import { BiHelpCircle } from "react-icons/bi";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Trip, type SimulationResults } from "../../../../types";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { getChartData, getLabel } from "./helpers";
import CustomLabel from "./custom-label";
import { FaShareAlt } from "react-icons/fa";
import { generateUrlToShare } from "../../helpers/shareableLink";
import { keyframes } from "@emotion/react";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

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
  const breakpoint = useBreakpoint();
  const { isOpen, onOpen, onToggle, onClose } = useDisclosure();

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
    <Box h="100%" w="100%">
      <Text mr={3} align="center" color="#595959" fontSize={["small", "large"]}>
        {chartTitle}{" "}
        <IconButton
          onClick={() =>
            generateUrlToShare(inputs, setShowCopiedLinkNotification)
          }
          aria-label="delete"
          borderRadius="20px"
          icon={<FaShareAlt size={20} />}
        />
        {showCopiedLinkNotification && (
          <Box
            position="fixed"
            bottom="20px"
            left="50%"
            transform="translateX(-50%)"
            bg="green.500"
            color="white"
            p="10px"
            borderRadius="md"
            boxShadow="md"
            textAlign="center"
            zIndex="1000"
            animation={`${fadeIn} 0.5s, ${fadeOut} 0.5s 2.5s`}
          >
            {t("chart.copied-link")}
          </Box>
        )}
      </Text>
      <Alert
        status="info"
        my={3}
        borderRadius={5}
        fontSize={[10, 12]}
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
            formatter={(value, name: string) => [
              `${round(Number(value), 0)} kg`,
              getLabel(name, t),
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

      <Flex justifyContent="flex-end" height="auto" width="100%">
        <ChakraTooltip
          label={t("results.explanation")}
          isOpen={isOpen}
          fontSize={breakpoint === "base" ? 11 : 12}
        >
          <span style={{ fontSize: breakpoint === "base" ? 10 : 12 }}>
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

export default Chart;
