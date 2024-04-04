import {
  Box,
  useBreakpoint,
  Tooltip as ChakraTooltip,
  Flex,
  useDisclosure,
  Image,
  Link,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import mollow from "../assets/logo_mollow.png";
import sailcoop from "../assets/logo_sailcoop.jpg";

const AboutView = () => {
  const { t } = useTranslation();

  const breakpoint = useBreakpoint()


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
        Traveling without using car or airplane (the most carbon intensive means of transport) might be challenging.
        The train (or bus) network is not uniformised within Europe and finding the right, optimal and affordable connections through countries is a challenge.
        </Text>
        <Text marginBottom={3}>
        The web platform  {' '}<a href={'https://www.mollow.eu/'} target="_blank" rel="noreferrer" style={{color: "blue"}}>Mollow</a>{' '} gives a lot of advices and tested routes to give you inspiration for your next trip.
        It is built around the idea that the journey itself should be a part your holidays, and takes advantages of this by visiting the wonderful cities you get into along the way.
        </Text>
        <Link to='https://www.mollow.eu/' style={{ height: "100%" }}>
        <Image src={mollow} h={breakpoint === "base" ? 6 :  "60%"} />
        </Link>
        <Text marginBottom={3}>
        Accessing islands without plane require most of the time to take a ferry and this is also a carbon intensive mean of transportation (taken per km).
        To propose an alternative to that the company sailcoop offers to sail between the continent and corsica for instance
        </Text>
        <Link to='https://www.sailcoop.fr/' style={{ height: "100%" }}>
        <Image src={sailcoop} h={breakpoint === "base" ? 6 :  "60%"} />
        </Link>
        <Text marginBottom={3}>
       We also add the opportunity to give adives on long distance slow traveling with the media BonPote and the Shimla project:
        </Text>
    </Box>
  );
};

export default AboutView;
