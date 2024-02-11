import { Button, HStack, Image, Spacer } from "@chakra-ui/react";
import logo from "../assets/logo.png";

const navItems = ["Methodology", "About", "Licenses", "Contact"];

const NavBar = () => (
  <HStack
    w="100%"
    position="fixed"
    background="#515151"
    px={6}
    py={4}
    boxShadow="md"
    zIndex={3}
    h="64px"
  >
    <Image src={logo} h="100%" />
    <Spacer />
    <HStack display={["none", "block"]}>
      {navItems.map((item) => (
        <Button
          key={item}
          color="#fff"
          variant="ghost"
          _hover={{ backgroundColor: "none", color: "#D1D1D1" }}
          _active={{ backgroundColor: "none", color: "#D1D1D1" }}
        >
          {item}
        </Button>
      ))}
    </HStack>
  </HStack>
);

export default NavBar;
