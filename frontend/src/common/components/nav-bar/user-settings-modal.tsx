import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import SettingsChoices, { LANGUAGES, MAP_THEMES } from "./settings-choices";

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
    <Modal onClose={onClose} isOpen={isOpen} isCentered>
      <ModalOverlay />
      <ModalContent margin={5}>
        <ModalHeader>{t("navbar.settings")}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
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
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default UserSettingsModal;
