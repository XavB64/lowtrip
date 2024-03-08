import {
  Card,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
  Tooltip as ChakraTooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { Form } from "./form";
import { Chart } from "./chart";
import { useRef, useState } from "react";
import { ApiResponse, StepProps } from "../types";
import { BiHelpCircle } from "react-icons/bi";
import { useTranslation } from "react-i18next";

interface FormPanelProps {
  response?: ApiResponse;
  setResponse: (response: ApiResponse) => void;
  myTripSteps: StepProps;
  alternativeTripSteps: StepProps;
}

export function FormPanel({
  response,
  setResponse,
  myTripSteps,
  alternativeTripSteps,
}: FormPanelProps) {
  const { t } = useTranslation();
  const [tabIndex, setTabIndex] = useState(0);
  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };
  const chartRef = useRef(null);

  const scrollToChart = () =>
    (chartRef.current as any)?.scrollIntoView({ behavior: "smooth" });

  const { isOpen, onOpen, onToggle, onClose } = useDisclosure();

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
        {/* <Heading
          color="#FF0000"
          fontSize="large"
          fontWeight={900}
          textAlign="center"
        >
          BETA - Report any feedback to ...
        </Heading> */}
        <Heading
          color="#595959"
          fontSize="x-large"
          fontWeight={900}
          textAlign="center"
        >
          {t("home.compareTravelEmissions")}
          <ChakraTooltip label={t("home.toolDescription")} isOpen={isOpen}>
            <span>
              <BiHelpCircle
                style={{ display: "inline-block", marginLeft: "5px" }}
                onMouseEnter={onOpen}
                onMouseLeave={onClose}
                onClick={onToggle}
              />
            </span>
          </ChakraTooltip>
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
  );
}
