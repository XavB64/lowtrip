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
import { Box } from "@chakra-ui/react";

interface ChartProps {
  response?: ApiResponse;
}

export function Chart({ response }: ChartProps) {
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
    <Box height="100%" width="100%">
      <h2
        style={{
          color: "#595959",
          fontSize: "large",
          fontWeight: 900,
          textAlign: "center",
        }}
      >
        Emissions of your trip compared to other means of transportation
      </h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={getChartData(transports, trips)}
          margin={{ bottom: 20 }}
        >
          <XAxis
            dataKey="name"
            label={{
              value: "Mean of transport",
              position: "insideBottom",
              offset: -10,
            }}
          />
          <YAxis padding={{ top: 30 }} hide />
          <Tooltip formatter={(value) => `${round(+value, 1)} kgCO2eq`} />
          {uniqBy(trips, "NAME").map((trip) => (
            <Bar dataKey={trip.NAME} fill={trip.colors} stackId="a">
              <LabelList
                dataKey="name"
                content={<CustomizedLabel trips={trips} tripName={trip.NAME} />}
              />{" "}
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

const CustomizedLabel = ({ trips, tripName, ...props }: CustomLabelProps) => {
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
        y={+(props.y ?? 0) - 20}
        textAnchor="middle"
      >
        {round(total)}
      </text>
      <text
        x={+(props.x ?? 0) + +(props.width ?? 0) / 2}
        y={+(props.y ?? 0) - 5}
        textAnchor="middle"
        fontSize={12}
      >
        kgCO2eq
      </text>
    </>
  );
};
