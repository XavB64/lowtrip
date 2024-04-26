import { Box, IconButton } from "@chakra-ui/react";
import { useState } from "react";
import { BiChevronUp } from "react-icons/bi";

import { FormPanel } from "../components/form/form-panel";
import { useSteps } from "../hooks";
import { ApiResponse } from "../types";
import { Map } from "../components/map";
import { checkIsOnMobile } from "../utils";
import { CacheProvider } from "../context";

const MainView = ({ isDarkTheme }: { isDarkTheme: boolean }) => {
  const [response, setResponse] = useState<ApiResponse>();
  const myTripSteps = useSteps();
  const alternativeTripSteps = useSteps();

  const isOnMobile = checkIsOnMobile();

  return (
    <CacheProvider>
      <FormPanel
        response={response}
        setResponse={setResponse}
        myTripSteps={myTripSteps}
        alternativeTripSteps={alternativeTripSteps}
      />
      <Box w="100%" h={["calc(100vh - 64px)", "100%"]} position="relative">
        <Map
          isDarkTheme={isDarkTheme}
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
    </CacheProvider>
  );
};

export default MainView;
