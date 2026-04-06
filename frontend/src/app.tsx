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

import { useEffect, useMemo, useState } from "react";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import NavbarWrapper from "./common/components/NavBar";
import { ConsentContextProvider } from "./common/context/consentContext";
import { SimulationProvider } from "./common/context/simulationContext";
import { API_URL } from "./config";
import {
  ContactView,
  ErrorView,
  MainView,
  MethodView,
  AboutView,
} from "./views";
import "./i18n";
import "./styles.scss";

const App = () => {
  // first API call to wake up the server
  useEffect(() => {
    fetch(API_URL, {
      headers: { "Access-Contol-Allow-Origin": "*" },
    });
  }, []);

  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const themeSettings = useMemo(
    () => ({
      isDarkTheme,
      switchMapTheme: () => setIsDarkTheme((prev) => !prev),
    }),
    [isDarkTheme],
  );

  const router = createBrowserRouter([
    {
      path: "/",
      element: <NavbarWrapper themeSettings={themeSettings} />,
      children: [
        {
          path: "/",
          element: (
            <SimulationProvider>
              <MainView isDarkTheme={isDarkTheme} />
            </SimulationProvider>
          ),
        },
        {
          path: "/contact",
          element: <ContactView />,
        },
        {
          path: "/method",
          element: <MethodView />,
        },
        {
          path: "/about",
          element: <AboutView />,
        },
      ],
      errorElement: <ErrorView />,
    },
    {
      path: "/embed",
      element: (
        <ConsentContextProvider>
          <SimulationProvider>
            <div className="embedded-view">
              <MainView isDarkTheme={false} withLogo={true} />
            </div>
          </SimulationProvider>
        </ConsentContextProvider>
      ),
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
