import { useEffect, useState } from "react";

export function useStationData(inputValues) {
  const [stationsData, setStationsData] = useState([]);

  useEffect(() => {
    console.log("useEffect");
    const fetchData = async () => {
      try {
        const response = await fetch("/assets/stations_vf.csv");
        const text = await response.text();

        setStationsData(parseCSV(text));
      } catch (error) {}
    };

    if (inputValues) fetchData();
  }, [inputValues]);

  return { stationsData };
}

function parseCSV(csv) {
  const [headerRow, ...rows] = csv.split("\n");
  const headers = headerRow.split(";");
  const data = [];

  rows.forEach((row) => {
    const values = row.split(";");
    if (values.length === headers.length) {
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });
      data.push(rowData);
    }
  });

  return data;
}
