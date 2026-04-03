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

import { PropsWithChildren } from "react";

import "./Modal.scss";

type ModalProps = PropsWithChildren<{
  onClose: () => void;
  isOpen: boolean;
  headerTitle: string;
}>;

const Modal = ({ headerTitle, onClose, isOpen, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal__overlay" onClick={onClose} />

      <div className="modal__content">
        <div className="modal__header">
          <h2 className="modal__title">{headerTitle}</h2>

          <button className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
