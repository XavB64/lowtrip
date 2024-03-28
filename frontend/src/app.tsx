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

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./i18n";

import NavbarWrapper from "./components/nav-bar";
import { API_URL } from "./config";
import { ContactView, ErrorView, MainView } from "./views";

const App = () => {
  // first API call to wake up the server
  useEffect(() => {
    axios.get(API_URL, {
      headers: { "Access-Contol-Allow-Origin": "*" },
    });
  }, []);

  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const themeSettings = useMemo(
    () => ({
      isDarkTheme,
      switchMapTheme: () => setIsDarkTheme((prev) => !prev),
    }),
    [isDarkTheme]
  );

  const router = createBrowserRouter([
    {
      path: "/",
      element: <NavbarWrapper themeSettings={themeSettings} />,
      children: [
        {
          path: "/",
          element: <MainView isDarkTheme={isDarkTheme}/>,
        },
        {
          path: "/contact",
          element: <ContactView />,
        },
      ],
      errorElement: <ErrorView />,
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
