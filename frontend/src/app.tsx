import { ChakraProvider, Stack, VStack } from "@chakra-ui/react";
import axios from "axios";
import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./i18n";

import NavBar from "./components/nav-bar";
import { API_URL } from "./config";
import theme from "./theme";
import { ErrorView, MainView } from "./views";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainView />,
    errorElement: <ErrorView />,
  },
]);

const App = () => {
  // first API call to wake up the server
  useEffect(() => {
    axios.get(API_URL, {
      headers: { "Access-Contol-Allow-Origin": "*" },
    });
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <VStack w="100vw" h={["100%", "100vh"]} spacing={0}>
        <NavBar />
        <Stack
          direction={["column", "row"]}
          w="100%"
          h="100%"
          pt="64px"
          spacing={0}
        >
          <RouterProvider router={router} />
        </Stack>
      </VStack>
    </ChakraProvider>
  );
};

export default App;
