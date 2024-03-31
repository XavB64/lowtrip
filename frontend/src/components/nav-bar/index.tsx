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
  Button,
  HStack,
  Image,
  Spacer,
  useBreakpointValue,
  useBreakpoint,
  VStack,
  Stack,
  ChakraProvider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";
import { GiHamburgerMenu } from "react-icons/gi";

import Logo from "../../assets/logo.png";
import gitLogo from "../../assets/github.png";
import MethodologyPdf from "../../assets/lowtrip_methodology.pdf";
import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router-dom";
import theme from "../../theme";
import UserSettingsModal from "./user-settings-modal";
import UserSettingsSelector from "./user-settings-selector";

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
  const { isOpen, onOpen: openErrorModal, onClose } = useDisclosure();
  const navItems = [
    {
      name: "About",
      component: <Link to="/about">{t("navbar.about")}</Link>,
    },
    {
      name: "Contact",
      component: <Link to="/contact">{t("navbar.contact")}</Link>,
    },
    {
      name: "Methods",
      component: <Link to="/method">{t("navbar.methodology")}</Link>,
    },
    {
      name: "Github",
      component: <Link to="https://github.com/XavB64/lowtrip/" style={{ height: "100%" }}>
      <Image src={gitLogo} h={breakpoint === "base" ? 6 :  "80%"} />
    </Link>
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
        {breakpoint !== "base" ? (
          <>
            {navItems.map((item) => (
              <Button
                key={item.name}
                fontSize={16}
                color="#fff"
                variant="ghost"
                _hover={{ backgroundColor: "none", color: "#D1D1D1" }}
                _active={{ backgroundColor: "none", color: "#D1D1D1" }}
              >
                {item.component}
              </Button>
            ))}
            <UserSettingsSelector themeSettings={themeSettings} />
          </>
        ) : (
          <>
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<GiHamburgerMenu size={25} />}
                colorScheme="transparent"
              />
              <MenuList>
                {navItems.map((item) => (
                  <MenuItem key={item.name}>{item.component}</MenuItem>
                ))}
                <MenuItem onClick={openErrorModal}>
                  {t("navbar.settings")}
                </MenuItem>
              </MenuList>
            </Menu>
            <UserSettingsModal
              isOpen={isOpen}
              onClose={() => {
                onClose();
              }}
              themeSettings={themeSettings}
            />
          </>
        )}
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
