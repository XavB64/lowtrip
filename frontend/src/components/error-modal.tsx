import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
} from "@chakra-ui/react";

const ErrorModal = ({
  onClose,
  isOpen,
  errorMessage,
}: {
  onClose: () => void;
  isOpen: boolean;
  errorMessage: string;
}) => (
  <Modal onClose={onClose} isOpen={isOpen} isCentered>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Ooops something happened !</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        {errorMessage ? (
          <Text>{errorMessage}</Text>
        ) : (
          <Text>Sorry, we could not find any path.</Text>
        )}
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose}>Try with another trip</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export default ErrorModal;
