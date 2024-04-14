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
        Traveling sustainably across Europe, without relying on cars or airplanes, presents numerous challenges. The continent's train and bus networks are diverse and sometimes difficult to navigate, making it tricky to find efficient and affordable connections between countries. 
        This is where {' '}<a href={'https://www.mollow.eu/'} target="_blank" rel="noreferrer" style={{color: "blue"}}>Mollow</a>{' '}  steps in as a comprehensive web platform designed to revolutionize your travel experience.
        </Text>
        <Text marginBottom={3}>
        Mollow provides a wealth of advice and tested routes to give you inspiration for your next great adventure. The platform is founded on the belief that the journey itself should be a memorable part of your holiday. By embracing this philosophy, Mollow encourages travelers to explore and appreciate the charming cities and breathtaking landscapes that unfold along the way.
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
        They tested our method to estimate their associated carbon footprint.
        </Text>
        <Link to='https://bonpote.com/aller-voir-les-aurores-boreales-en-train-3-000km-de-bonheur/' style={{ height: "100%" }}>
        <Image src={bonpote} h={breakpoint === "base" ? 6 :  "60%"} />
        </Link>
        <Text marginBottom={3}>
        The documentary film "Shimla," named after the Indian city, explores the theme of water and ecology through an ambitious journey from Paris to India and back using a combination of trains, ferries, and hitchhiking (autostop).
        This innovative approach to travel not only raises awareness about environmental issues but also showcases how diverse modes of transportation can be used to minimize carbon emissions and maximize the richness of the travel experience.
        Johan and Victoria, the movie makers, trusted lowtrip to estimate the associated carbon footprint of their adventure and subsequent reductions compared to usual means of transportation for such distances.
        </Text>
        <Link to='https://www.shimla.fr/' style={{ height: "100%" }}>
        <Image src={shimla} h={breakpoint === "base" ? 6 :  "60%"} />
        </Link>



        {/* FRANCAIS
      > */}




        <Text marginBottom={3}>
        Voyager de manière durable à travers l'Europe, sans avoir recours à la voiture ou à l'avion, présente de nombreux défis. Les réseaux de trains et de bus du continent sont divers et parfois difficiles à naviguer, ce qui rend difficile la recherche de connexions efficaces et abordables entre les pays. 
        C'est là qu'intervient {' '}<a href={'https://www.mollow.eu/'} target="_blank" rel="noreferrer" style={{color: "blue"}}>Mollow</a>{' '}, une plateforme web complète conçue pour révolutionner votre expérience de voyage.
        </Text>
        <Text marginBottom={3}>
        Mollow provides a wealth of advice and tested routes to give you inspiration for your next great adventure. The platform is founded on the belief that the journey itself should be a memorable part of your holiday. By embracing this philosophy, Mollow encourages travelers to explore and appreciate the charming cities and breathtaking landscapes that unfold along the way.
        </Text>
        <Link to='https://www.mollow.eu/' style={{ height: "100%" }}>
        <Image src={mollow} h={breakpoint === "base" ? 6 :  "60%"} />
        </Link>
        <Text marginBottom={3}>
        Pour accéder aux îles sans avoir recours à l'avion, il faut souvent emprunter des ferries, qui peuvent également contribuer de manière significative aux émissions de carbone par kilomètre parcouru. Afin d'offrir une alternative durable aux voyages en ferry traditionnels, Sailcoop propose une solution unique et écologique : naviguer au gré du vent entre le continent et des destinations telles que la Corse.
        </Text>
        <Text marginBottom={3}>
        Sailcoop exploite la puissance du vent pour offrir des voyages inoubliables à travers la mer. En optant pour des voyages en voilier plutôt qu'en ferry, les voyageurs réduisent non seulement leur empreinte carbone, mais s'embarquent également dans une aventure plus immersive et en phase avec l'environnement.
        </Text>
        <Link to='https://www.sailcoop.fr/' style={{ height: "100%" }}>
        <Image src={sailcoop} h={breakpoint === "base" ? 6 :  "60%"} />
        </Link>
        <Text marginBottom={3}>
        Un exemple de voyage durable est le voyage entrepris par le média Bon Pote pour observer les aurores boréales dans les îles Lofoten, en voyageant entièrement en train depuis Paris. Cette initiative illustre la faisabilité et la beauté des voyages terrestres, en mettant l'accent sur les expériences gratifiantes qui découlent de la réduction de la dépendance à l'égard des modes de transport à forte intensité de carbone. Ils ont testé notre méthode pour estimer leur empreinte carbone.
        </Text>
        <Link to='https://bonpote.com/aller-voir-les-aurores-boreales-en-train-3-000km-de-bonheur/' style={{ height: "100%" }}>
        <Image src={bonpote} h={breakpoint === "base" ? 6 :  "60%"} />
        </Link>
        <Text marginBottom={3}>
        Le film documentaire "Shimla", du nom de la ville indienne, explore les thèmes de l'eau et de l'écologie à travers un voyage ambitieux de Paris à l’Inde en utilisant une combinaison de trains, de ferries et d'auto-stop. Cette approche innovante du voyage permet non seulement de sensibiliser aux questions environnementales, mais aussi de montrer comment divers modes de transport peuvent être utilisés pour minimiser les émissions de carbone et maximiser la richesse de l'expérience de voyage. Johan et Victoria, les réalisateurs du film, ont fait confiance à lowtrip pour estimer l'empreinte carbone associée à leur aventure et les réductions subséquentes par rapport aux moyens de transport habituels pour de telles distances.
        </Text>
        <Link to='https://www.shimla.fr/' style={{ height: "100%" }}>
        <Image src={shimla} h={breakpoint === "base" ? 6 :  "60%"} />
        </Link>
    </Box>

    
  );
};

export default AboutView;
