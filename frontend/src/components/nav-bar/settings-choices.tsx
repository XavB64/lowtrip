import { Box, Flex, useBreakpoint } from "@chakra-ui/react";

import { useTranslation } from "react-i18next";
import { PrimaryButton } from "../primary-button";

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
              key={option}
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

export default SettingsChoices;
