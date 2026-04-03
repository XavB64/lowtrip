// Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { useEffect, useState } from "react";

import { ChakraProvider, useDisclosure } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation } from "react-router-dom";

import gitLogo from "assets/github.png";
import Logo from "assets/lowtrip_logo.png";
import { ConsentContextProvider } from "common/context/consentContext";
import theme from "theme";

import UserSettingsModal from "./UserSettingsModal";
import UserSettingsSelector from "./UserSettingsPopover";
import CookieBanner from "../cookie-banner";
import "./NavBar.scss";

const GithubItem = ({ className }: { className?: string }) => (
  <a
    href="https://github.com/XavB64/lowtrip/"
    target="_blank"
    rel="noopener noreferrer"
    className={`github-link ${className}`}
  >
    <img src={gitLogo} alt="GitHub" />
  </a>
);

const navItems = [
  {
    name: "About",
    url: "/about",
    label: "about",
  },
  {
    name: "Contact",
    url: "/contact",
    label: "contact",
  },
  {
    name: "Methods",
    url: "/method",
    label: "methodology",
  },
];

const NavBar = ({
  themeSettings,
}: {
  themeSettings: {
    isDarkTheme: boolean;
    switchMapTheme: () => void;
  };
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isOpen, onOpen: openErrorModal, onClose } = useDisclosure();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="nav-bar">
      <Link to="/" className="logo">
        <img src={Logo} />
      </Link>

      {/* Desktop menu */}
      <div className="nav-bar-desktop">
        {navItems.map((item) => (
          <Link to={item.url} key={item.name} className="desktop-link">
            {t(`navbar.${item.label}`)}
          </Link>
        ))}
        <GithubItem />
        <UserSettingsSelector themeSettings={themeSettings} />
      </div>

      {/* Mobile menu */}
      <div className="nav-bar-mobile">
        <button className="burger" onClick={toggleMenu}>
          ☰
        </button>

        {isMenuOpen && (
          <div className="dropdown">
            {navItems.map((item) => (
              <Link
                to={item.url}
                key={item.name}
                className="dropdown-item"
                onClick={toggleMenu}
              >
                {t(`navbar.${item.label}`)}
              </Link>
            ))}
            <GithubItem className="dropdown-item" />
            <button
              className="dropdown-item"
              onClick={() => {
                openErrorModal();
                setIsMenuOpen(false);
              }}
            >
              {t("navbar.settings")}
            </button>
          </div>
        )}

        <UserSettingsModal
          isOpen={isOpen}
          onClose={onClose}
          themeSettings={themeSettings}
        />
      </div>
    </div>
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
    <ConsentContextProvider>
      <div className="nav-bar-wrapper">
        <NavBar themeSettings={themeSettings} />
        <div className="view" id="main-body">
          <Outlet />
        </div>
        <CookieBanner />
      </div>
    </ConsentContextProvider>
  </ChakraProvider>
);

export default NavbarWrapper;
