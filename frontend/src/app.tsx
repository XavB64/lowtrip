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
          <Form setResponse={setResponse} steps={steps} />
          <Chart response={response} />
        </Stack>
      </Stack>
      <Container style={{ padding: 0 }}>
        <Map
          response={response}
          stepsCoords={steps.values.map((step) => step.locationCoords)}
        />
      </Container>
    </Stack>
  );
}

export default App;
