// // Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// // Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// // This program is free software: you can redistribute it and/or modify
// // it under the terms of the GNU General Public License as published by
// // the Free Software Foundation, either version 3 of the License, or
// // (at your option) any later version.

// // This program is distributed in the hope that it will be useful,
// // but WITHOUT ANY WARRANTY; without even the implied warranty of
// // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// // GNU General Public License for more details.

// // You should have received a copy of the GNU General Public License
// // along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
        <Button onClick={onClose}>Modify trip</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export default ErrorModal;
