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
import { IoMdSettings } from "react-icons/io";
import Logo from "../assets/logo.png";
import MethodologyPdf from "../assets/lowtrip_methodology.pdf";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { PrimaryButton } from "./primary-button";
import { Link, Outlet } from "react-router-dom";
import theme from "../theme";

const LANGUAGES = ["fr", "en"];
const MAP_THEMES = ["light", "dark"];

const SettingsChoices = ({
  options,
  onChange,
  optionIsSelected,
  translationKey,
}: {
  options: string[];
  onChange: (option: string) => void;
  optionIsSelected: (option: string) => boolean;
  translationKey: string;
}) => {
  const { t } = useTranslation();
  const breakpoint = useBreakpoint();
  return (
    <Box mb={1}>
      <Flex align="center" textAlign="center" justifyContent="center">
        {options.map((option) => {
          const isSelected = optionIsSelected(option);
          return (
            <PrimaryButton
              marginRight={1}
              fontSize={breakpoint === "base" ? 14 : 16}
              onClick={() => {
                onChange(option);
              }}
              variant={isSelected ? undefined : "outline"}
              disabled={isSelected}
            >
              {t(`navbar.${translationKey}_${option}`)}
            </PrimaryButton>
          );
        })}
      </Flex>
    </Box>
  );
};

const UserSettingsSelector = ({
  themeSettings: { isDarkTheme, switchMapTheme },
}: {
  themeSettings: {
    isDarkTheme: boolean;
    switchMapTheme: () => void;
  };
}) => {
  const breakpoint = useBreakpoint();
  return (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button
          borderRadius="15px"
          fontSize={breakpoint === "base" ? 9 : 16}
          colorScheme="transparent"
        >
          <IoMdSettings size={25} color="white" />
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
          <SettingsChoices
            options={LANGUAGES}
            onChange={(language) => i18n.changeLanguage(language)}
            optionIsSelected={(language) => i18n.language === language}
            translationKey="language"
          />
          <SettingsChoices
            options={MAP_THEMES}
            onChange={() => {
              switchMapTheme();
            }}
            optionIsSelected={(theme) =>
              (isDarkTheme && theme === "dark") ||
              (!isDarkTheme && theme === "light")
            }
            translationKey="theme"
          />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

const NavBar = ({
  themeSettings,
}: {
  themeSettings: {
    isDarkTheme: boolean;
    switchMapTheme: () => void;
  };
}) => {
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
        <UserSettingsSelector themeSettings={themeSettings} />
      </HStack>
    </HStack>
  );
};

const NavbarWrapper = ({
  themeSettings,
}: {
  themeSettings: {
    isDarkTheme: boolean;
    switchMapTheme: () => void;
  };
}) => (
  <ChakraProvider theme={theme}>
    <VStack w="100vw" h={["100%", "100vh"]} spacing={0}>
      <NavBar themeSettings={themeSettings} />
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
