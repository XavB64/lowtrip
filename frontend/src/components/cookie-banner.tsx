import React, { useEffect } from "react";
import { Button, Center, Text } from "@chakra-ui/react";
import { useConsentContext } from "../context/consentContext";
import { useTranslation } from "react-i18next";

const CookieBanner = () => {
  const { t } = useTranslation();
  const { consentGiven, setConsentGiven } = useConsentContext();

  const handleConsent = () => {
    setConsentGiven(true);
    localStorage.setItem("cookieConsent", "true");
    const script = document.createElement("script");
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-L04SXCD38Q";
    script.async = true;
    document.head.appendChild(script);

    // Initialize Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    }
    gtag("js", new Date());
    gtag("config", "G-L04SXCD38Q");
  };

  useEffect(() => {
    if (localStorage.getItem("cookieConsent")) {
      setConsentGiven(true);
    }
  }, []);

  if (consentGiven) {
    return null;
  }

  return (
    <Center
      position="absolute"
      zIndex={100}
      backgroundColor="#515151"
      bottom={0}
      width="100%"
      padding={2}
      flexDirection={["column", "row"]}
    >
      <Text color="white" textAlign={["center", "left"]} pb={[2, 0]}>
        {t("cookieBanner.message")}
      </Text>
      <Button
        marginLeft={[0, 4]}
        onClick={handleConsent}
        width={["100%", "auto"]}
      >
        {t("cookieBanner.ok")}
      </Button>
    </Center>
  );
};

export default CookieBanner;
