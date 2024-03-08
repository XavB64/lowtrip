import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Spacer,
} from "@chakra-ui/react";
import Logo from "../assets/logo.png";
import MethodologyPdf from "../assets/lowtrip_methodology.pdf";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { PrimaryButton } from "./primary-button";

const navItems = [
  {
    name: "Methodology",
    component: (
      <a href={MethodologyPdf} target="_blank" rel="noreferrer">
        Methodology
      </a>
    ),
  },
];

const LANGUAGES = ["fr", "en"];

const LanguageSelector = () => {
  const { t } = useTranslation();
  return (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button borderRadius="15px">Paramètres</Button>
      </PopoverTrigger>
      <PopoverContent
        color="white"
        bg="#efefef"
        borderColor="#efefef"
        borderRadius="15px"
      >
        <PopoverArrow bg="#efefef" />
        <PopoverBody>
          <Box>
            <Flex align="center" textAlign="center" justifyContent="center">
              {LANGUAGES.map((language) => {
                const isSelectedLanguage = i18n.language === language;
                return (
                  <PrimaryButton
                    marginRight={1}
                    onClick={() => {
                      i18n.changeLanguage(language);
                    }}
                    variant={isSelectedLanguage ? undefined : "outline"}
                    disabled={isSelectedLanguage}
                  >
                    {t(`language_${language}`)}
                  </PrimaryButton>
                );
              })}
            </Flex>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

const NavBar = () => (
  <HStack
    w="100%"
    position="fixed"
    background="#515151"
    px={6}
    py={4}
    boxShadow="md"
    zIndex={3}
    h="64px"
  >
    <Image src={Logo} h="100%" />
    <Spacer />
    <HStack display={["none", "block"]}>
      {navItems.map((item) => (
        <Button
          key={item.name}
          color="#fff"
          variant="ghost"
          _hover={{ backgroundColor: "none", color: "#D1D1D1" }}
          _active={{ backgroundColor: "none", color: "#D1D1D1" }}
        >
          {item.component}
        </Button>
      ))}
      <LanguageSelector />
    </HStack>
  </HStack>
);
export default NavBar;
