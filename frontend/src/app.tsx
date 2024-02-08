import axios from "axios";
import { useEffect, useRef, useState } from "react";
import {
  ChakraProvider,
  HStack,
  VStack,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  Heading,
  Box,
  Stack,
} from "@chakra-ui/react";

import "./styles.css";
import { Form } from "./components/form";
import { Chart } from "./components/chart";
import { Map } from "./components/map";
import { ApiResponse } from "./types";
import { useSteps } from "./hooks";
import { API_URL } from "./config";
import NavBar from "./components/navBar";
import theme from "./theme";

function AppBody() {
  const [response, setResponse] = useState<ApiResponse>();
  const myTripSteps = useSteps();
  const alternativeTripSteps = useSteps();

  useEffect(() => {
    axios.get(API_URL, {
      headers: { "Access-Contol-Allow-Origin": "*" },
    });
  }, []);

  return (
    <HStack w="100vw" h="100vh" pt={5}>
      <NavBar />
      <VStack
        maxWidth={["100%", "30%"]}
        justifyContent="space-between"
        height="100%"
        overflow="auto"
        flexShrink={1}
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
                />
              </TabPanel>
              <TabPanel padding={0}>
                <Form
                  key="alternative-form"
                  setResponse={setResponse}
                  stepsProps={alternativeTripSteps}
                  stepsToCompare={myTripSteps.values}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
          <Chart response={response} />
        </VStack>
      </VStack>
      <Box w="100%" h={["800px", "100%"]}>
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
  );
}

export default function App() {
  return (
    <ChakraProvider theme={theme}>
      <AppBody />
    </ChakraProvider>
  );
}
