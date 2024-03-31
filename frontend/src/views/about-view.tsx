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



const AboutView = () => {
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
        Hello, here we will put general information on how to do slow travel and give examples:
        Mollow, Sailcoop, Shimla, BonPote...
        </Text>

    </Box>
  );
};

export default AboutView;
