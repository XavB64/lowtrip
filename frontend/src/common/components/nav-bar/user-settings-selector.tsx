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

import { useEffect, useRef, useState } from "react";

import i18n from "i18next";
import { IoMdSettings } from "react-icons/io";

import SettingsChoices, { LANGUAGES, MAP_THEMES } from "./settings-choices";
import "./UserSettings.scss";

const UserSettingsSelector = ({
  themeSettings: { isDarkTheme, switchMapTheme },
}: {
  themeSettings: {
    isDarkTheme: boolean;
    switchMapTheme: () => void;
  };
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  const togglePopover = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={popoverRef} className="user-settings user-settings-popover">
      <button className="popover__trigger" onClick={togglePopover}>
        <IoMdSettings className="setting-icon" />
      </button>

      {isOpen && (
        <div className="popover__content">
          <div className="popover__arrow" />

          <div className="popover__body">
            <SettingsChoices
              options={LANGUAGES}
              onChange={(language) => {
                i18n.changeLanguage(language);
                setIsOpen(false);
              }}
              optionIsSelected={(language) => i18n.language === language}
              isLanguageSelector
            />

            <SettingsChoices
              options={MAP_THEMES}
              onChange={switchMapTheme}
              optionIsSelected={(theme) =>
                (isDarkTheme && theme === "dark") ||
                (!isDarkTheme && theme === "light")
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettingsSelector;
