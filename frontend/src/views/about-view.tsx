import { Box, Heading, Image, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import mollow from "../assets/logo_mollow.png";
import sailcoop from "../assets/logo_sailcoop.jpg";
import bonpote from "../assets/bonpote_aurores.png";
import shimla from "../assets/shimla_text.png";
import { checkIsOnMobile } from "../utils";

const AboutView = () => {
  const { t } = useTranslation();
  const isOnMobile = checkIsOnMobile();

  return (
    <Box
      h="100%"
      w="100%"
      //overflowX= "hidden"

      paddingLeft="10%"
      paddingRight="10%"
      marginTop={3}
      color="#595959"
      fontSize={["small", "large"]}
    >
      <Text marginBottom={3} marginTop={isOnMobile ? 3 : 10}>
        {t("about.introduction1")}
      </Text>
      <Text marginBottom={3}>{t("about.introduction2")}</Text>

      <Heading
        as="h1"
        color="blue.500"
        fontWeight="bold"
        fontSize={"3xl"}
        marginTop={20}
        marginBottom={3}
      >
        {t("about.inspiringProjects")}
      </Heading>
      <Stack
        marginBottom={10}
        direction={isOnMobile ? "column-reverse" : "row"}
        width="100%"
        alignItems="center"
      >
        <a href="https://www.mollow.eu/" target="_blank" rel="noreferrer">
          <Image src={mollow} />
        </a>
        <Box paddingLeft={isOnMobile ? 0 : 5}>
          <Text marginBottom={3}>
            {t("about.mollow1")}
            <a
              href="https://www.mollow.eu/"
              target="_blank"
              rel="noreferrer"
              style={{ color: "blue" }}
            >
              Mollow
            </a>
            {t("about.mollow2")}
          </Text>
          <Text marginBottom={3}>{t("about.mollow3")}</Text>
        </Box>
      </Stack>

      <Stack
        marginBottom={10}
        direction={isOnMobile ? "column" : "row"}
        width="100%"
        alignItems="center"
      >
        <Box paddingRight={isOnMobile ? 0 : 5}>
          <Text marginBottom={3} marginTop={3}>
            {t("about.sailcoop1")}
          </Text>
          <Text marginBottom={3}>{t("about.sailcoop2")}</Text>
        </Box>
        <Box width={isOnMobile ? "100%" : "1000px"}>
          <a href="https://www.sailcoop.fr/" target="_blank" rel="noreferrer">
            <Image src={sailcoop} />
          </a>
        </Box>
      </Stack>

      <Stack
        marginBottom={10}
        direction={isOnMobile ? "column-reverse" : "row"}
        alignItems="center"
      >
        <a
          href="https://bonpote.com/aller-voir-les-aurores-boreales-en-train-3-000km-de-bonheur/"
          target="_blank"
          rel="noreferrer"
        >
          <Image src={bonpote} />
        </a>
        <Text
          marginBottom={3}
          marginTop={3}
          marginLeft={isOnMobile ? 0 : 5}
          width={isOnMobile ? "100%" : "150%"}
        >
          {t("about.bonpote")}
        </Text>
      </Stack>

      <Stack
        marginBottom={10}
        direction={isOnMobile ? "column" : "row"}
        alignItems="center"
      >
        <Text
          marginBottom={3}
          marginTop={3}
          marginRight={isOnMobile ? 0 : 5}
          width={isOnMobile ? "100%" : "150%"}
        >
          {t("about.shimla")}
        </Text>
        <a href="https://www.shimla.fr/" target="_blank" rel="noreferrer">
          <Image src={shimla} marginTop={3} />
        </a>
      </Stack>
    </Box>
  );
};

export default AboutView;
