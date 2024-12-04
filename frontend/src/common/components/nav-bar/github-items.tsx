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

import { Button, Link as ChakraLink, Image, MenuItem } from "@chakra-ui/react";

import gitLogo from "../../../assets/github.png";

export const GithubItem = () => (
  <ChakraLink
    href="https://github.com/XavB64/lowtrip/"
    h="100%"
    isExternal
    alignContent="center"
  >
    <Button
      fontSize={16}
      color="#fff"
      variant="ghost"
      _hover={{ backgroundColor: "none", color: "#D1D1D1" }}
      _active={{ backgroundColor: "none", color: "#D1D1D1" }}
    >
      <Image src={gitLogo} h={{ base: 6, md: "80%" }} />
    </Button>
  </ChakraLink>
);

export const GithubMenuItem = () => (
  <ChakraLink
    href="https://github.com/XavB64/lowtrip/"
    h="100%"
    isExternal
    alignContent="center"
  >
    <MenuItem>
      <Image src={gitLogo} h={{ base: 6, md: "80%" }} />
    </MenuItem>
  </ChakraLink>
);
