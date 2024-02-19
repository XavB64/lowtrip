import {
  Box,
  ChakraProvider,
  IconButton,
  Stack,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { BiChevronUp } from "react-icons/bi";

import { FormPanel } from "./components/form-panel";
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
        pt="64px"
        spacing={0}
      >
        <FormPanel
          response={response}
          setResponse={setResponse}
          myTripSteps={myTripSteps}
          alternativeTripSteps={alternativeTripSteps}
        />
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
