import { useState } from "react";
import { Container, Stack, Tab, Tabs } from "@mui/material";
import "./styles.css";
import { Form } from "./components/form";
import { Chart } from "./components/chart";
import { Map } from "./components/map";
import { ApiResponse } from "./types";
import { useSteps } from "./hooks";

function App() {
  const [response, setResponse] = useState<ApiResponse>();
  const myTripSteps = useSteps();
  const alternativeTripSteps = useSteps();
  const [activeTab, setActiveTab] = useState(0);

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
          <h1 className="title">Compare the emissions from your travels</h1>
          <Tabs
            value={activeTab}
            onChange={() => setActiveTab((activeTab + 1) % 2)}
            aria-label="basic tabs example"
          >
            <Tab
              label="My trip"
              sx={{
                textTransform: "none",
                fontFamily: "Montserrat",
                backgroundColor: activeTab === 0 ? "#efefef" : undefined,
                borderRadius: activeTab === 0 ? "12px 12px 0 0" : undefined,
              }}
            />
            <Tab
              label="Alternative trip"
              sx={{
                textTransform: "none",
                fontFamily: "Montserrat",
                backgroundColor: activeTab === 1 ? "#efefef" : undefined,
                borderRadius: activeTab === 1 ? "12px 12px 0 0" : undefined,
              }}
            />
          </Tabs>
          {activeTab === 0 ? (
            <Form
              key="main-form"
              setResponse={setResponse}
              stepsProps={myTripSteps}
            />
          ) : (
            <Form
              key="alternative-form"
              setResponse={setResponse}
              stepsProps={alternativeTripSteps}
              stepsToCompare={myTripSteps.values}
            />
          )}
          <Chart response={response} />
        </Stack>
      </Stack>
      <Container
        style={{ padding: 0, margin: 0, maxWidth: "100%", flexShrink: 3 }}
      >
        <Map
          response={response}
          stepsCoords={
            myTripSteps.values
              .filter((step) => !!step.locationCoords)
              .map((step) => step.locationCoords) as [number, number][]
          }
          alternativeStepsCoords={
            alternativeTripSteps.values
              .filter((step) => !!step.locationCoords)
              .map((step) => step.locationCoords) as [number, number][]
          }
        />
      </Container>
    </Stack>
  );
}

export default App;
