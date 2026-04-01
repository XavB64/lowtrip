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

import "./Button.scss";

type ButtonProps = PropsWithChildren<{
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  outline?: boolean;
  className?: string;
}>;

const Button = ({
  onClick,
  loading = false,
  disabled = false,
  outline,
  className,
  children,
}: ButtonProps) => {
  return (
    <button
      className={`button ${disabled ? "disabled" : ""} ${outline ? "outline" : ""} ${loading ? "spinner-container" : ""} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {loading ? <div className="spinner" /> : children}
    </button>
  );
};

export default Button;
