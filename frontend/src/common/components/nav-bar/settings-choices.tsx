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

import { FR, GB, IT, ES, DE } from "country-flag-icons/react/3x2";
import { useTranslation } from "react-i18next";

import Button from "../Button";

export const LANGUAGES = ["fr", "en", "it", "es", "de"];
export const MAP_THEMES = ["light", "dark"];

const getFlag = (language: string) => {
  switch (language) {
    case "en":
      return <GB className="flag-icon" />;
    case "fr":
      return <FR className="flag-icon" />;
    case "it":
      return <IT className="flag-icon" />;
    case "es":
      return <ES className="flag-icon" />;
    case "de":
      return <DE className="flag-icon" />;
    default:
      return null;
  }
};

type SettingsChoicesProps = {
  options: string[];
  onChange: (option: string) => void;
  optionIsSelected: (option: string) => boolean;
  isLanguageSelector?: boolean;
};

const SettingsChoices = ({
  options,
  onChange,
  optionIsSelected,
  isLanguageSelector,
}: SettingsChoicesProps) => {
  const { t } = useTranslation();
  return (
    <div className="settings-group">
      {options.map((option) => {
        const isSelected = optionIsSelected(option);
        const content = isLanguageSelector
          ? getFlag(option)
          : t(`navbar.${option}`);

        return (
          <Button
            key={option}
            className={`settings-button ${isSelected ? "selected" : "outline"}`}
            onClick={() => onChange(option)}
            disabled={isSelected}
          >
            {content}
          </Button>
        );
      })}
    </div>
  );
};

export default SettingsChoices;
