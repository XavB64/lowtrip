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

import { Button, ButtonProps, Spinner } from "@chakra-ui/react";

interface PrimaryButtonProps extends ButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}
export function PrimaryButton({
  onClick,
  isLoading = false,
  isDisabled = false,
  ...props
}: PrimaryButtonProps) {
  return (
    <>
      <Button
        onClick={onClick}
        isDisabled={isLoading || isDisabled}
        borderRadius="20px"
        colorScheme="blue"
        width="100%"
        height="50px"
        cursor={isDisabled ? "not-allowed" : "pointer"}
        whiteSpace="break-spaces"
        {...props}
      >
        {isLoading ? <Spinner /> : props.children}
      </Button>
    </>
  );
}
