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
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
} from "@chakra-ui/react";
import { Form } from "./form";
import { Chart } from "../chart";
import { useRef, useState } from "react";
import { ApiResponse, StepProps } from "../../types";
import { useTranslation } from "react-i18next";

interface FormPanelProps {
  response?: ApiResponse;
  setResponse: (response: ApiResponse) => void;
  myTripSteps: StepProps;
  alternativeTripSteps: StepProps;
}

export const FormPanel = ({
  response,
  setResponse,
  myTripSteps,
  alternativeTripSteps,
}: FormPanelProps) => {
  const { t } = useTranslation();
  const [tabIndex, setTabIndex] = useState(0);
  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };
  const chartRef = useRef<null | HTMLDivElement>(null);

  const scrollToChart = () =>
    chartRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <VStack
      width={["100%", "45%"]}
      justifyContent="space-between"
      height="100%"
      minHeight={["calc(100vh - 64px)", "none"]}
      overflow="auto"
      p={[1, 3]}
    >
      <VStack padding={3} spacing={5} height="100%" width="100%">
        <Heading
          color="#595959"
          fontSize="x-large"
          fontWeight={900}
          textAlign="center"
        >
          {t("home.compareTravelEmissions")}
        </Heading>

        <Tabs
          index={tabIndex}
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
                key="main-form"
                setResponse={setResponse}
                stepsProps={myTripSteps}
                afterSubmit={scrollToChart}
                changeTab={() => setTabIndex((tabIndex + 1) % 2)}
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
        {response && (
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
        )}
      </VStack>
    </VStack>
  );
};
