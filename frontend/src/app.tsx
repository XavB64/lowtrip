import axios from "axios";
import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./i18n";

import NavbarWrapper from "./components/nav-bar";
import { API_URL } from "./config";
import { ContactView, ErrorView, MainView } from "./views";

const router = createBrowserRouter([
  {
    path: "/",
    element: <NavbarWrapper />,
    children: [
      {
        path: "/",
        element: <MainView />,
      },
      {
        path: "/contact",
        element: <ContactView />,
      },
    ],
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
      <RouterProvider router={router} />
  );
};

export default App;
