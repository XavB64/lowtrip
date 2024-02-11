import { Button, HStack, Image, Spacer } from "@chakra-ui/react";
import Logo from "../assets/logo.png";
import MethodologyPdf from "../assets/20240210_lowtrip_methodology.pdf";

const navItems = [
  {
    name: "Methodology",
    component: (
      <a href={MethodologyPdf} target="_blank" rel="noreferrer">
        Methodology
      </a>
    ),
  },
];

const NavBar = () => (
  <HStack
    w="100%"
    position="fixed"
    background="#515151"
    px={6}
    py={4}
    boxShadow="md"
    zIndex={3}
    h={16}
  >
    <Image src={Logo} h="100%" />
    <Spacer />
    <HStack display={["none", "block"]}>
      {navItems.map((item) => (
        <Button
          key={item.name}
          color="#fff"
          variant="ghost"
          _hover={{ backgroundColor: "none", color: "#D1D1D1" }}
          _active={{ backgroundColor: "none", color: "#D1D1D1" }}
        >
          {item.component}
        </Button>
      ))}
    </HStack>
  </HStack>
);

export default NavBar;
