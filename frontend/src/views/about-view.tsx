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
import bonpote from "../assets/bonpote_aurores.png";
import shimla from "../assets/shimla_text.png";

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
        Traveling sustainably across Europe, without relying on cars or airplanes, presents a unique set of challenges. The continent's train and bus networks are diverse and sometimes difficult to navigate, making it tricky to find efficient and affordable connections between countries. 
        This is where {' '}<a href={'https://www.mollow.eu/'} target="_blank" rel="noreferrer" style={{color: "blue"}}>Mollow</a>{' '}  steps in as a comprehensive web platform designed to revolutionize your travel experience.
        </Text>
        <Text marginBottom={3}>
        Mollow provides a wealth of advice and tested routes that not only streamline your journey but also inspire your next great adventure. The platform is founded on the belief that the journey itself should be a memorable part of your holiday. By embracing this philosophy, Mollow encourages travelers to explore and appreciate the charming cities and breathtaking landscapes that unfold along the way.
        Simplifying the complexities of low carbon European travel, it also empowers you to discover hidden gems and iconic landmarks en route to your destination.
        </Text>
        <Link to='https://www.mollow.eu/' style={{ height: "100%" }}>
        <Image src={mollow} h={breakpoint === "base" ? 6 :  "60%"} />
        </Link>
        <Text marginBottom={3}>
        Accessing islands without relying on planes often involves taking ferries, which can also contribute significantly to carbon emissions per kilometer traveled. To offer a sustainable alternative to traditional ferry travel, Sailcoop presents a unique and eco-friendly solution: sailing with the wind between the mainland and destinations like Corsica.
        </Text>
        <Text marginBottom={3}>
        Sailcoop harnesses the power of wind to provide unforgettable journeys across the sea. By opting for sailing trips instead of ferry rides, travelers not only reduce their carbon footprint but also embark on a more immersive and environmentally conscious adventure.
        </Text>
        <Link to='https://www.sailcoop.fr/' style={{ height: "100%" }}>
        <Image src={sailcoop} h={breakpoint === "base" ? 6 :  "60%"} />
        </Link>
        <Text marginBottom={3}>
        One exemplary project that epitomizes sustainable travel is the journey undertaken by the media Bon Pote to witness the Northern Lights in the Lofoten Islands, traveling entirely by train from Paris. This initiative showcases the feasibility and beauty of overland travel, emphasizing the rewarding experiences that come with reducing reliance on carbon-intensive modes of transportation.
        They tested our method to estimate their associated carbon footprint
        </Text>
        <Link to='https://bonpote.com/aller-voir-les-aurores-boreales-en-train-3-000km-de-bonheur/' style={{ height: "100%" }}>
        <Image src={bonpote} h={breakpoint === "base" ? 6 :  "60%"} />
        </Link>
        <Text marginBottom={3}>
        Another compelling project that exemplifies sustainable travel is the documentary film "Shimla," named after the Indian city, which explores themes of water and ecology through an ambitious journey from Paris to India and back using a combination of trains, ferries, and hitchhiking (autostop).
        This innovative approach to travel not only raises awareness about environmental issues but also showcases how diverse modes of transportation can be used to minimize carbon emissions and maximize the richness of the travel experience.
        Again, Johan and Victoria, the movie makers, trusted Lowtrip to estimate the associated carbon footprint of their adventure and subsequent reductions compared to usual means of transportation for such distances.
        </Text>
        <Link to='https://www.shimla.fr/' style={{ height: "100%" }}>
        <Image src={shimla} h={breakpoint === "base" ? 6 :  "60%"} />
        </Link>
    </Box>
  );
};

export default AboutView;
