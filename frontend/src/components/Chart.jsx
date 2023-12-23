import { Box } from "@mui/material";
import { BarChart } from "@mui/x-charts";

export function Chart({ response }) {
  if (!response) return null;
  const data = JSON.parse(response.data.plot_div).data.slice(0, -1);
  const titles = uniq(data.map((details) => details.x[0]));

  return (
    <Box height="100%">
      <BarChart
        xAxis={[
          {
            scaleType: "band",
            data: titles,
            label: "Mean of transport",
          },
        ]}
        yAxis={[{ label: "kgCO2eq" }]}
        series={data.map((details) => ({
          data: titles.map((title) =>
            title === details.x[0] ? details.y[0] : null
          ),
          stack: "total",
          label: details.hovertemplate,
          color: details.marker.color,
        }))}
        slotProps={{ legend: { hidden: true } }}
      />
    </Box>
  );
}

function uniq(array) {
  const onlyUnique = (value, index, array) => {
    return array.indexOf(value) === index;
  };

  return array.filter(onlyUnique);
}
