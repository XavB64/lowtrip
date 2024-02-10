import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  fonts: {
    body: "Montserrat",
    heading: "Montserrat",
  },
  colors: {
    blue: {
      50: "#b3eef5",
      100: "#8fdde5",
      200: "#6bcbd6",
      300: "#48bac6",
      400: "#24a8b7",
      500: "#0097a7",
      600: "#008b9a",
      700: "#007f8d",
      800: "#007380",
      900: "#006773",
    },
  },
});

export default theme;
