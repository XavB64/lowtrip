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
  useBreakpointValue,
  useBreakpoint
} from "@chakra-ui/react";
import Logo from "../assets/logo.png";
import MethodologyPdf from "../assets/lowtrip_methodology.pdf";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { PrimaryButton } from "./primary-button";

const LANGUAGES = ["fr", "en"];

const LanguageSelector = () => {
  const { t } = useTranslation();
  const breakpoint = useBreakpoint();
  return (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button borderRadius="15px" fontSize={breakpoint === "base" ? 9 : 16}>{t("navbar.settings")}
        </Button>
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
                    fontSize={breakpoint === "base" ? 14 : 16}
                    onClick={() => {
                      i18n.changeLanguage(language);
                    }}
                    variant={isSelectedLanguage ? undefined : "outline"}
                    disabled={isSelectedLanguage}
                  >
                    {t(`navbar.language_${language}`)}
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



const NavBar = () => {
   // Determine the display of the navigation items based on screen size
    const displayNavItems = useBreakpointValue({base: "block", md: "block" }); 
    const breakpoint = useBreakpoint();
    const { t } = useTranslation();
    const navItems = [
    {
      name: "Methodology",
      
      component: (
        <a href={MethodologyPdf} target="_blank" rel="noreferrer">
          {t("navbar.methodology")}
        </a>
      ),
    },
  ];

  return (
    <HStack
      w="100%"
      position="fixed"
      background="#515151"
      px={breakpoint === "base" ? 3 : 6}
      py={4}
      boxShadow="md"
      zIndex={3}
      h="64px"
    >
      <Image src={Logo} h="100%" />
      <Spacer />
      <HStack display={displayNavItems}> 
  {/* display={["none", "block"]}> */}
        {navItems.map((item) => (
          <Button
            key={item.name}
            fontSize={breakpoint === "base" ? 9 : 16}
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
};
export default NavBar;
