import { useTranslation } from "react-i18next";

import Modal from "components/Modal";

import { useSimulationContext } from "./helpers/simulationContext";

const ErrorModal = () => {
  const { t } = useTranslation();

  const { error, cleanError } = useSimulationContext();

  if (!error) return null;

  return (
    <Modal
      headerTitle={t(`form.errorModal.${error.code}_title`, error)}
      className="error-modal"
      onClose={cleanError}
      isOpen
    >
      <p>{t(`form.errorModal.${error.code}_content`, error)}</p>
    </Modal>
  );
};

export default ErrorModal;
