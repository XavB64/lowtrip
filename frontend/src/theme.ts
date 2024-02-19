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
    lightgrey: {
      50: "#ffffff",
      100: "#f6f6f6",
      200: "#ededed",
      300: "#e4e4e4",
      400: "#dbdbdb",
      500: "#d3d3d3",
      600: "#cacaca",
      700: "#c1c1c1",
      800: "#b8b8b8",
      900: "#afafaf",
    },
  },
});

export default theme;
