// // Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// // Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// // This program is free software: you can redistribute it and/or modify
// // it under the terms of the GNU General Public License as published by
// // the Free Software Foundation, either version 3 of the License, or
// // (at your option) any later version.

// // This program is distributed in the hope that it will be useful,
// // but WITHOUT ANY WARRANTY; without even the implied warranty of
// // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// // GNU General Public License for more details.

// // You should have received a copy of the GNU General Public License
// // along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
  useBreakpoint,
  VStack,
  Stack,
  ChakraProvider,
} from "@chakra-ui/react";
import Logo from "../assets/logo.png";
import MethodologyPdf from "../assets/lowtrip_methodology.pdf";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { PrimaryButton } from "./primary-button";
import { Link, Outlet } from "react-router-dom";
import theme from "../theme";

const LANGUAGES = ["fr", "en"];

const LanguageSelector = () => {
  const { t } = useTranslation();
  const breakpoint = useBreakpoint();
  return (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button borderRadius="15px" fontSize={breakpoint === "base" ? 9 : 16}>
          {t("navbar.settings")}
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
  const displayNavItems = useBreakpointValue({ base: "block", md: "block" });
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
    {
      name: "Contact",
      component: <Link to="/contact">{t("navbar.contact")}</Link>,
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
      <Link to="/" style={{ height: "100%" }}>
        <Image src={Logo} h="100%" />
      </Link>
      <Spacer />
      <HStack display={displayNavItems}>
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

const NavbarWrapper = () => (
  <ChakraProvider theme={theme}>
    <VStack w="100vw" h={["100%", "100vh"]} spacing={0}>
      <NavBar />
      <Stack
        direction={["column", "row"]}
        w="100%"
        h="100%"
        pt="64px"
        spacing={0}
      >
        <Outlet />
      </Stack>
    </VStack>
  </ChakraProvider>
);
export default NavbarWrapper;
