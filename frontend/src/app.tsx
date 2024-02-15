import {
  Box,
  Card,
  ChakraProvider,
  Heading,
  IconButton,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
  Text,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { BiChevronUp } from "react-icons/bi";

import { Chart } from "./components/chart";
import { Form } from "./components/form";
import { Map } from "./components/map";
import NavBar from "./components/nav-bar";
import { API_URL } from "./config";
import { useSteps } from "./hooks";
import theme from "./theme";
import { ApiResponse } from "./types";
import { checkIsOnMobile } from "./utils";

function AppBody() {
  const [response, setResponse] = useState<ApiResponse>();
  const myTripSteps = useSteps();
  const alternativeTripSteps = useSteps();
  const chartRef = useRef(null);
  const scrollToChart = () =>
    (chartRef.current as any)?.scrollIntoView({ behavior: "smooth" });

  const isOnMobile = checkIsOnMobile();

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
          height={["calc(100vh - 64px)", "100%"]}
          overflow="auto"
          p={3}
          pt={5}
        >
          <VStack padding={3} spacing={5} height="100%" width="100%">
            <Heading
              color="#595959"
              fontSize="x-large"
              fontWeight={900}
              textAlign="center"
            >
              Compare your travel emissions
            </Heading>

            <VStack>
              <Text alignSelf={"flex-start"}>
                Select a departure, a destination and a transport means and
                compute the emissions of your trip !
              </Text>
              <Text alignSelf={"flex-start"}>
                To compare 2 trips, fill the "Other trip" tab.
              </Text>
            </VStack>

            <Tabs isFitted variant="enclosed" w="100%">
              <TabList borderBottom="none">
                <Tab _selected={{ bg: "#efefef" }} borderRadius="12px 12px 0 0">
                  My trip
                </Tab>
                <Tab _selected={{ bg: "#efefef" }} borderRadius="12px 12px 0 0">
                  Add another trip to compare
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
        <Box w="100%" h={["calc(100vh - 64px)", "100%"]}>
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
      {isOnMobile && (
        <IconButton
          aria-label="scroll-to-top"
          icon={<BiChevronUp />}
          onClick={() =>
            window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
          }
          zIndex={2}
          position="fixed"
          bottom={3}
          left={3}
          colorScheme="blue"
          isRound
          display={["flex", "none"]}
        />
      )}
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
