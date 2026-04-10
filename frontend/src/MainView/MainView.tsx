import { useEffect } from "react";

import { BiChevronUp } from "react-icons/bi";
import { useSearchParams } from "react-router-dom";

import { IconButton } from "components/Button";
import { CacheProvider } from "MainView/helpers/cacheContext";
import { useConsentContext } from "MainView/helpers/consentContext";
import { useSimulationContext } from "MainView/helpers/simulationContext";
import { checkIsOnMobile } from "utils";

import Chart from "./Chart";
import { extractPathStepsFromSimplifiedSteps } from "./helpers/shareableLink";
import { stepsAreInvalid } from "./helpers/utils";
import { LeftPanel } from "./LeftPanel";
import Map from "./Map";

const MainView = ({
  isDarkTheme,
  withLogo,
}: {
  isDarkTheme: boolean;
  withLogo?: boolean;
}) => {
  const { consentGiven } = useConsentContext();

  const { setSteps, setAlternativeSteps, submitForm, simulationResults } =
    useSimulationContext();

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
      <div className="main-view">
        <LeftPanel withLogo={withLogo} />

        <Map isDarkTheme={isDarkTheme} />

        {isOnMobile && (
          <>
            <IconButton
              className={`scroll-to-top-button ${consentGiven ? "consent-given" : ""}`}
              icon={<BiChevronUp />}
              onClick={() => {
                const mainBody = document.getElementById("main-body");
                if (mainBody)
                  mainBody.scrollTo({ top: 0, left: 0, behavior: "smooth" });
              }}
              aria-label="scroll-to-top"
            />
            {simulationResults && (
              <Chart simulationResults={simulationResults} />
            )}
          </>
        )}
      </div>
    </CacheProvider>
  );
};

export default MainView;
