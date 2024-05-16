import { Box, IconButton, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { BiChevronUp } from "react-icons/bi";

import { FormPanel } from "../components/form/form-panel";
import { useSteps } from "../hooks";
import { ApiResponse } from "../types";
import { Map } from "../components/map";
import { checkIsOnMobile } from "../utils";
import { CacheProvider, useConsentContext } from "../context";

const MainView = ({
  isDarkTheme,
  withLogo,
}: {
  isDarkTheme: boolean;
  withLogo?: boolean;
}) => {
  const { consentGiven } = useConsentContext();
  const [response, setResponse] = useState<ApiResponse>();
  const myTripSteps = useSteps();
  const alternativeTripSteps = useSteps();

  const isOnMobile = checkIsOnMobile();

  return (
    <CacheProvider>
      <Stack direction={["column", "row"]} width="100%">
        <FormPanel
          response={response}
          setResponse={setResponse}
          myTripSteps={myTripSteps}
          alternativeTripSteps={alternativeTripSteps}
          withLogo={withLogo}
        />
        <Box w="100%" height="100%" minHeight={["calc(100vh - 64px)", "none"]}>
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
            onClick={() => {
              const mainBody = document.getElementById("main-body");
              if (mainBody)
                mainBody.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            }}
            zIndex={2}
            position="fixed"
            bottom={consentGiven ? 3 : "20%"}
            left={3}
            colorScheme="blue"
            isRound
            display={["flex", "none"]}
          />
        )}
      </Stack>
    </CacheProvider>
  );
};

export default MainView;
