import { Box, Heading, useBreakpoint } from "@chakra-ui/react";
import { round, sumBy, uniq, uniqBy } from "lodash";
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
import { ApiResponse, Transport, TripData } from "../types";

interface ChartProps {
  response?: ApiResponse;
}

export function Chart({ response }: ChartProps) {
  const breakpoint = useBreakpoint();

  if (!response) return null;

  const trips: TripData[] = [
    ...(response.data.direct_trip ? JSON.parse(response.data.direct_trip) : []),
    ...JSON.parse(response.data.my_trip ?? {}),
    ...(response.data.alternative_trip
      ? JSON.parse(response.data.alternative_trip)
      : []),
  ];
  const transports = uniq(
    trips.map((tripData) => tripData["Mean of Transport"])
  );

  return (
    <Box h="100%" w="100%">
      <Heading
        color="#595959"
        fontSize={["small", "large"]}
        textAlign="center"
        marginBottom={3}
      >
        {response.data.alternative_trip
          ? "Compared emissions of your two trips"
          : "Your trip VS other means of transport"}
      </Heading>
      <ResponsiveContainer
        height={breakpoint === "base" ? 230 : 350}
        width="100%"
      >
        <BarChart
          data={getChartData(transports, trips)}
          margin={{ bottom: 20 }}
        >
          <XAxis dataKey="name" fontSize={breakpoint === "base" ? 10 : 14} />
          <YAxis padding={{ top: 30 }} hide />
          <Tooltip formatter={(value) => `${round(+value, 1)} kgCO2eq`} />
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
    </Box>
  );
}

function getChartData(transports: Transport[], trips: TripData[]) {
  return transports.map((transport) => {
    let result: { [key: string]: string | number } = { name: transport };
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
