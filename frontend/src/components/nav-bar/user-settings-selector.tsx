import {
  Button,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  useBreakpoint,
} from "@chakra-ui/react";
import { IoMdSettings } from "react-icons/io";
import SettingsChoices, { LANGUAGES, MAP_THEMES } from "./settings-choices";

import i18n from "i18next";

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
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default UserSettingsSelector;
