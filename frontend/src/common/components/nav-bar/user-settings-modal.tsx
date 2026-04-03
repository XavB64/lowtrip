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

import i18n from "i18next";
import { useTranslation } from "react-i18next";

import SettingsChoices, { LANGUAGES, MAP_THEMES } from "./settings-choices";
import Modal from "../Modal";

const UserSettingsModal = ({
  onClose,
  isOpen,
  themeSettings: { switchMapTheme, isDarkTheme },
}: {
  onClose: () => void;
  isOpen: boolean;
  themeSettings: {
    isDarkTheme: boolean;
    switchMapTheme: () => void;
  };
}) => {
  const { t } = useTranslation();
  return (
    <Modal onClose={onClose} isOpen={isOpen} headerTitle={t("navbar.settings")}>
      <div className="user-settings user-settings-modal">
        <SettingsChoices
          options={LANGUAGES}
          onChange={(language) => i18n.changeLanguage(language)}
          optionIsSelected={(language) => i18n.language === language}
          isLanguageSelector
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
        />
      </div>
    </Modal>
  );
};

export default UserSettingsModal;
