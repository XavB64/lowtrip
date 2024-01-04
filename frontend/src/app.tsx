import { useState } from "react";
import { Container, Stack } from "@mui/material";
import "./styles.css";
import { useDestination } from "./hooks";
import { Form } from "./components/form";
import { Chart } from "./components/chart";
import { Map } from "./components/map";
import { ApiResponse } from "./types";

function App() {
  const [response, setResponse] = useState<ApiResponse>();
  const departure = useDestination();
  const destinations = [useDestination()];

  return (
    <Stack direction="row" className="App" style={{ height: "100vh" }}>
      <Stack
        maxWidth="40%"
        justifyContent="space-between"
        height="100%"
        overflow="auto"
      >
        <Stack padding={3}>
          <Stack padding={3} justifyItems="center">
            <h1 className="title">Compare the emissions from your travels</h1>
          </Stack>
          {/* <NewForm /> */}
          <Form
            setResponse={setResponse}
            departure={departure}
            destinations={destinations}
            setDestinations={() => {}}
          />
          <Chart response={response} />
        </Stack>
      </Stack>
      <Container style={{ padding: 0 }}>
        <Map
          response={response}
          departureCoords={departure.locationCoords}
          destinationsCoords={destinations.map(
            (destination) => destination.locationCoords
          )}
        />
      </Container>
    </Stack>
  );
}

export default App;
