import { Box, Flex, useBreakpoint } from "@chakra-ui/react";
import { FR, GB, IT, ES, DE } from "country-flag-icons/react/3x2";
import { useTranslation } from "react-i18next";

import { PrimaryButton } from "../primary-button";

export const LANGUAGES = ["fr", "en", "it", "es", "de"];
export const MAP_THEMES = ["light", "dark"];

const getFlag = (language: string) => {
  switch (language) {
    case "en":
      return <GB style={{ width: "50px" }} />;
    case "fr":
      return <FR style={{ width: "50px" }} />;
    case "it":
      return <IT style={{ width: "50px" }} />;
    case "es":
      return <ES style={{ width: "50px" }} />;
    case "de":
      return <DE style={{ width: "50px" }} />;
    default:
      return null;
  }
};

const SettingsChoices = ({
  options,
  onChange,
  optionIsSelected,
  isLanguageSelector,
}: {
  options: string[];
  onChange: (option: string) => void;
  optionIsSelected: (option: string) => boolean;
  isLanguageSelector?: boolean;
}) => {
  const { t } = useTranslation();
  const breakpoint = useBreakpoint();
  return (
    <Box mb={1}>
      <Flex align="center" textAlign="center" justifyContent="center">
        {options.map((option) => {
          const isSelected = optionIsSelected(option);
          const content = isLanguageSelector
            ? getFlag(option)
            : t(`navbar.${option}`);
          return (
            <PrimaryButton
              key={option}
              marginRight={1}
              fontSize={breakpoint === "base" ? 14 : 16}
              onClick={() => {
                onChange(option);
              }}
              variant={isSelected ? undefined : "outline"}
              disabled={isSelected}
            >
              {content}
            </PrimaryButton>
          );
        })}
      </Flex>
    </Box>
  );
};

export default SettingsChoices;
