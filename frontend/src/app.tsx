import {
  Box,
  Card,
  ChakraProvider,
  Heading,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useRef, useState } from "react";

import { Chart } from "./components/chart";
import { Form } from "./components/form";
import { Map } from "./components/map";
import NavBar from "./components/navBar";
import { API_URL } from "./config";
import { useSteps } from "./hooks";
import "./styles.css";
import theme from "./theme";
import { ApiResponse } from "./types";

function AppBody() {
  const [response, setResponse] = useState<ApiResponse>();
  const myTripSteps = useSteps();
  const alternativeTripSteps = useSteps();
  const chartRef = useRef(null);
  const scrollToChart = () =>
    (chartRef.current as any)?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    axios.get(API_URL, {
      headers: { "Access-Contol-Allow-Origin": "*" },
    });
  }, []);

  return (
    <VStack w="100vw" h={["100%", "100vh"]} spacing={0}>
      <NavBar />
      <Stack
        direction={["column", "row"]}
        w="100%"
        h="100%"
        pt={16}
        spacing={0}
      >
        <VStack
          width={["100%", "45%"]}
          justifyContent="space-between"
          height="100%"
          overflow="auto"
          p={3}
          pt={5}
        >
          <VStack padding={3} spacing={5} height="100%">
            <Heading
              color="#595959"
              fontSize="x-large"
              fontWeight={900}
              textAlign="center"
            >
              Compare the emissions from your travels
            </Heading>
            <Tabs variant="enclosed" w="100%">
              <TabList>
                <Tab _selected={{ bg: "#efefef" }} borderRadius="12px 12px 0 0">
                  My trip
                </Tab>
                <Tab _selected={{ bg: "#efefef" }} borderRadius="12px 12px 0 0">
                  Alternative trip
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel padding={0}>
                  <Form
                    key="main-form"
                    setResponse={setResponse}
                    stepsProps={myTripSteps}
                    afterSubmit={scrollToChart}
                  />
                </TabPanel>
                <TabPanel padding={0}>
                  <Form
                    key="alternative-form"
                    setResponse={setResponse}
                    stepsProps={alternativeTripSteps}
                    stepsToCompare={myTripSteps.values}
                    afterSubmit={scrollToChart}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
            <Card
              ref={chartRef}
              position={["absolute", "static"]}
              w={[200, "100%"]}
              bottom={[3, "auto"]}
              right={[3, "auto"]}
              zIndex={2}
              p="10px"
              shadow="none"
            >
              <Chart response={response} />
            </Card>
          </VStack>
        </VStack>
        <Box w="100%" h={["95vh", "100%"]}>
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
        </Box>
      </Stack>
    </VStack>
  );
}

export default function App() {
  return (
    <ChakraProvider theme={theme}>
      <AppBody />
    </ChakraProvider>
  );
}
