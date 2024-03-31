import {
  Box,
  useBreakpoint,
  Tooltip as ChakraTooltip,
  Flex,
  useDisclosure,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import MethodologyPdf from "../assets/lowtrip_methodology.pdf";



const MethodView = () => {
  const { t } = useTranslation();


  return (

    <Box h="100%" 
    w="100%" 
    marginLeft={"20%"} 
    marginRight={"20%"}
    marginTop={3}
    color="#595959"
        fontSize={["small", "large"]}
        textAlign="left"
        justifyContent="center"
    >
      {/* <Flex
        align="center"
        color="#595959"
        fontSize={["small", "large"]}
        textAlign="left"
        justifyContent="center"
      > */}
        <Text marginBottom={3}>
        To calculate CO2 equivalent emissions per person, we multiply 
        the distance of a journey (km) by an emission factor (mass of CO2 
        equivalent per person per km). 
        </Text>

        <Text marginBottom={3}> 
        To put these results into perspective, the IPCC estimates that total 
        emissions per person per year should average 2tCO2eq to stay below 
        2°C global warming by 2050.
        </Text>
        <Text marginBottom={3}> 
        Distances correspond to geodesic distance (airplane), to a model of the 
        shortest route (ferry) or to the route given by the OpenStreetMap network 
        (bike, road and train).
        </Text>
        <Text marginBottom={3}> 
        Emissions factors consider usage (linked to the manufacture and use of energy to 
        move the vehicle) as well as infrastructure and vehicle construction where these 
        are significant. Emissions factors depend on the distance of a journey (airplane), 
        the countries crossed (electric car, train) or parameters provided by the user (car, ferry).
        </Text>
        <Text marginBottom={3}> 
        All the assumptions, data and sources used are available in the 
        <a href={MethodologyPdf} target="_blank" rel="noreferrer">
          {t("navbar.methodology")}
        </a> 
        document. The code for this application is Opensource and shared on
        <a href={"https://github.com/XavB64/lowtrip/"} target="_blank" rel="noreferrer">
          Github
        </a> 
        .
        </Text>

    </Box>
  );
};

export default MethodView;
