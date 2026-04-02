import { useEffect } from "react";

import { IconButton, Stack } from "@chakra-ui/react";
import { BiChevronUp } from "react-icons/bi";
import { useSearchParams } from "react-router-dom";

import { CacheProvider } from "common/context/cacheContext";
import { useConsentContext } from "common/context/consentContext";
import { useSimulationContext } from "common/context/simulationContext";
import { checkIsOnMobile } from "common/utils";

import { stepsAreInvalid } from "./components/form/helpers/utils";
import { LeftPanel } from "./components/left-panel";
import Map from "./components/Map";
import { extractPathStepsFromSimplifiedSteps } from "./helpers/shareableLink";

const MainView = ({
  isDarkTheme,
  withLogo,
}: {
  isDarkTheme: boolean;
  withLogo?: boolean;
}) => {
  const { consentGiven } = useConsentContext();

  const { setSteps, setAlternativeSteps, submitForm } = useSimulationContext();

  const isOnMobile = checkIsOnMobile();

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const mainTrip = searchParams.get("main-trip");
    if (!mainTrip) {
      return;
    }

    const steps = extractPathStepsFromSimplifiedSteps(JSON.parse(mainTrip));
    setSteps(steps);

    let alternativeSteps;
    const alternativeTrip = searchParams.get("alternative-trip");
    if (alternativeTrip) {
      alternativeSteps = extractPathStepsFromSimplifiedSteps(
        JSON.parse(alternativeTrip),
      );
      setAlternativeSteps(alternativeSteps);
    }

    if (!stepsAreInvalid(steps)) {
      submitForm(
        steps,
        alternativeSteps && !stepsAreInvalid(alternativeSteps)
          ? alternativeSteps
          : undefined,
      );
    }
  }, [searchParams]);

  return (
    <CacheProvider>
      <Stack direction={["column", "row"]} width="100%">
        <LeftPanel withLogo={withLogo} />

        <Map isDarkTheme={isDarkTheme} />

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
