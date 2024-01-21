import { useState } from "react";
import { Container, Stack } from "@mui/material";
import "./styles.css";
import { Form } from "./components/form";
import { Chart } from "./components/chart";
import { Map } from "./components/map";
import { ApiResponse } from "./types";
import { useSteps } from "./hooks";

function App() {
  const [response, setResponse] = useState<ApiResponse>();
  const steps = useSteps();

  return (
    <Stack direction="row" className="App" style={{ height: "100vh" }}>
      <Stack
        maxWidth="30%"
        justifyContent="space-between"
        height="100%"
        overflow="auto"
        flexShrink={1}
      >
        <Stack padding={3} height="100%">
          <Stack padding={3} justifyItems="center">
            <h1 className="title">Compare the emissions from your travels</h1>
          </Stack>
          <Form setResponse={setResponse} stepsProps={steps} />
          <Chart response={response} />
        </Stack>
      </Stack>
      <Container
        style={{ padding: 0, margin: 0, maxWidth: "100%", flexShrink: 3 }}
      >
        <Map
          response={response}
          stepsCoords={
            steps.values
              .filter((step) => !!step.locationCoords)
              .map((step) => step.locationCoords) as [number, number][]
          }
        />
      </Container>
    </Stack>
  );
}

export default App;
