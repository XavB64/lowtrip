// Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import {
  Card,
  Center,
  Heading,
  Image,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
} from "@chakra-ui/react";
import Form from "./form";
import Chart from "./chart";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Logo from "../../../assets/lowtrip_logo.png";
import { checkIsOnMobile } from "../../../common/utils";
import { useSimulationContext } from "../../../common/context/simulationContext";
import { TRIP_TYPE } from "../../../types";

type LeftPanelProps = {
  withLogo?: boolean;
};

export const LeftPanel = ({ withLogo }: LeftPanelProps) => {
  const { t } = useTranslation();
  const { simulationResults } = useSimulationContext();

  const [displayedTrip, setDisplayedTrip] = useState<TRIP_TYPE>(TRIP_TYPE.MAIN);

  const isOnMobile = checkIsOnMobile();

  const handleTabsChange = () => {
    if (displayedTrip === TRIP_TYPE.MAIN) {
      setDisplayedTrip(TRIP_TYPE.ALTERNATIVE);
    } else {
      setDisplayedTrip(TRIP_TYPE.MAIN);
    }
  };

  useEffect(() => {
    const scrollToChart = () => {
      const mainContainer = isOnMobile
        ? document.getElementById("main-body")
        : document.getElementById("left-panel");
      if (mainContainer)
        mainContainer.scrollTo({
          top: mainContainer.scrollHeight,
          left: 0,
          behavior: "smooth",
        });
    };

    // wait for the chart to render before scrolling
    if (simulationResults) setTimeout(() => scrollToChart(), 200);
  }, [simulationResults]);

  return (
    <VStack
      width={["100%", "45%"]}
      justifyContent="space-between"
      height="100%"
      minHeight={["calc(100vh - 64px)", "none"]}
      overflow="auto"
      p={1}
      id="left-panel"
    >
      <VStack padding={3} spacing={5} height="100%" width="100%">
        {withLogo && (
          <Center bgColor="blue.500" borderRadius={10} p={1}>
            <Image src={Logo} w={24} />
          </Center>
        )}
        <Heading
          color="#595959"
          fontSize="x-large"
          fontWeight={900}
          textAlign="center"
        >
          {t("home.compareTravelEmissions")}
        </Heading>

        <Tabs
          index={displayedTrip === TRIP_TYPE.MAIN ? 0 : 1}
          onChange={handleTabsChange}
          isFitted
          variant="enclosed"
          w="100%"
        >
          <TabList borderBottom="none">
            <Tab _selected={{ bg: "#efefef" }} borderRadius="12px 12px 0 0">
              {t("form.tabMyTrip")}
            </Tab>
            <Tab _selected={{ bg: "#efefef" }} borderRadius="12px 12px 0 0">
              {t("form.tabOtherTrip")}
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel padding={0}>
              <Form
                displayedTrip={displayedTrip}
                showAlternativeForm={() =>
                  setDisplayedTrip(TRIP_TYPE.ALTERNATIVE)
                }
              />
            </TabPanel>
            <TabPanel padding={0}>
              <Form displayedTrip={displayedTrip} />
            </TabPanel>
          </TabPanels>
        </Tabs>

        {simulationResults && !isOnMobile && (
          <Card
            position="static"
            w="100%"
            bottom="auto"
            right="auto"
            zIndex={2}
            p="10px"
            shadow="none"
          >
            <Chart simulationResults={simulationResults} />
          </Card>
        )}
      </VStack>
    </VStack>
  );
};
