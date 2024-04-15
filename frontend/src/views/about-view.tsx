import {
  Box,
  Image,
  Link,
  Text,
} from "@chakra-ui/react";
// import { useState } from "react";
import { useTranslation } from "react-i18next";
import mollow from "../assets/logo_mollow.png";
import sailcoop from "../assets/logo_sailcoop.jpg";
import bonpote from "../assets/bonpote_aurores.png";
import shimla from "../assets/shimla_text.png";
import { checkIsOnMobile } from "../utils";

const AboutView = () => {
  const { t } = useTranslation();
  const isOnMobile = checkIsOnMobile();
  const horizontalPadding = isOnMobile ? "10%" : "20%";

  return (

    <Box 
    h="100%" 
    w="100%" 
    paddingLeft={horizontalPadding}
    paddingRight={horizontalPadding}
    marginTop={3}
    color="#595959"
        fontSize={["small", "large"]}
        textAlign="left"
        justifyContent="center"
    >
      

        <Text marginBottom={3}>
        {t("about.mollow_1")}
        </Text>
        <Text marginBottom={3}>
        {t("about.mollow_2")}
        </Text>
        <Link to='https://www.mollow.eu/' >
        <Image src={mollow} h={isOnMobile  ? "100%" :  "50%"} />
        </Link>
        <Text marginBottom={3} marginTop={3}>
        {t("about.sailcoop_1")}
        </Text>
        <Text marginBottom={3}>
        {t("about.sailcoop_2")}
        </Text>
        <Link to='https://www.sailcoop.fr/'>
        <Image src={sailcoop} h={isOnMobile  ? "100%" :  "50%"}/>
        </Link>
        <Text marginBottom={3}  marginTop={3}>
        {t("about.bonpote")}
        </Text>
        <Link to='https://bonpote.com/aller-voir-les-aurores-boreales-en-train-3-000km-de-bonheur/'>
        <Image src={bonpote} h={isOnMobile  ? "100%" :  "60%"} />
        </Link>
        <Text marginBottom={3} marginTop={3}>
        {t("about.shimla")}
        </Text>
        <Link to='https://www.shimla.fr/' >
        <Image src={shimla} marginTop={3} h={isOnMobile  ? "100%" :  "70%"} />
        </Link>

    </Box>

    
  );
};

export default AboutView;
