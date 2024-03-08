import {
  Box,
  useBreakpoint,
  Tooltip as ChakraTooltip,
  Flex,
  useDisclosure,
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
import { ApiResponse, TripData } from "../types";
import { useTranslation } from "react-i18next";

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
  return (
    <Box h="100%" w="100%">
      <Flex
        align="center"
        color="#595959"
        fontSize={["small", "large"]}
        textAlign="center"
        justifyContent="center"
        marginBottom={3}
      >
        <h2 style={{ marginRight: "8px" }}>
          {response.data.alternative_trip
            ? t("results.vsOtherTrip")
            : response.data.direct_trip
            ? t("results.vsOtherMeans")
            : t("results.yourTripEmissions")}
        </h2>
      </Flex>
      <ResponsiveContainer
        height={breakpoint === "base" ? 230 : 350}
        width="100%"
      >
        <BarChart data={getChartData(trips)} margin={{ bottom: 20 }}>
          <XAxis dataKey="name" fontSize={breakpoint === "base" ? 8 : 14} />
          <YAxis padding={{ top: 30 }} hide />
          <Tooltip
            formatter={(value) => `${round(+value, 0)} kg`}
            contentStyle={{ fontSize: "12px" }}
          />
          {uniqBy(trips, "NAME").map((trip) => (
            <Bar
              key={trip.NAME}
              dataKey={t(trip.NAME)}
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
          fontSize={9}
        >
          <span>
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

function getChartData(trips: TripData[]) {
  const transports = uniq(
    trips.map((tripData) => tripData["Mean of Transport"])
  );

  return transports.map((transport) => {
    let result: { [key: string]: string | number } = {
      name: transport,
      displayedName: transport,
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
        x={+(props.x ?? 0) + +(props.width ?? 0) / 2}
        y={+(props.y ?? 0) - (breakpoint === "base" ? 15 : 20)}
        textAnchor="middle"
        fontSize={breakpoint === "base" ? 10 : 16}
      >
        {round(total)}
      </text>
      <text
        x={+(props.x ?? 0) + +(props.width ?? 0) / 2}
        y={+(props.y ?? 0) - 5}
        textAnchor="middle"
        fontSize={breakpoint === "base" ? 8 : 12}
      >
        kgCO2eq
      </text>
    </>
  );
};
