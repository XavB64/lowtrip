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

import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import Logo from "assets/lowtrip_logo.png";
import { useSimulationContext } from "common/context/simulationContext";
import { checkIsOnMobile } from "common/utils";
import { TRIP_TYPE } from "types";

import Chart from "./Chart";
import Form from "./form";
import "./LeftPanel.scss";

type LeftPanelProps = {
  withLogo?: boolean;
};

export const LeftPanel = ({ withLogo }: LeftPanelProps) => {
  const { t } = useTranslation();
  const { simulationResults } = useSimulationContext();

  const [displayedTrip, setDisplayedTrip] = useState<TRIP_TYPE>(TRIP_TYPE.MAIN);

  const isOnMobile = checkIsOnMobile();

  const handleTabsChange = () => {
    if (displayedTrip === TRIP_TYPE.MAIN) {
      setDisplayedTrip(TRIP_TYPE.ALTERNATIVE);
    } else {
      setDisplayedTrip(TRIP_TYPE.MAIN);
    }
  };

  useEffect(() => {
    const scrollToChart = () => {
      const mainContainer = isOnMobile
        ? document.getElementById("main-body")
        : document.getElementById("left-panel");
      if (mainContainer)
        mainContainer.scrollTo({
          top: mainContainer.scrollHeight,
          left: 0,
          behavior: "smooth",
        });
    };

    // wait for the chart to render before scrolling
    if (simulationResults) setTimeout(() => scrollToChart(), 200);
  }, [simulationResults]);

  return (
    <div className="left-panel">
      {withLogo && (
        <div className="logo-wrapper">
          <img src={Logo} alt="Logo" className="logo" />
        </div>
      )}

      <h1 className="title"> {t("home.compareTravelEmissions")}</h1>

      <div className="main-section">
        <div className="tab-list">
          <button
            className={`tab ${displayedTrip === TRIP_TYPE.MAIN ? "active" : ""}`}
            onClick={handleTabsChange}
          >
            {t("form.tabMyTrip")}
          </button>
          <button
            className={`tab ${displayedTrip === TRIP_TYPE.ALTERNATIVE ? "active" : ""}`}
            onClick={handleTabsChange}
          >
            {t("form.tabOtherTrip")}
          </button>
        </div>

        <Form
          displayedTrip={displayedTrip}
          showAlternativeForm={() => setDisplayedTrip(TRIP_TYPE.ALTERNATIVE)}
        />
      </div>

      {simulationResults && !isOnMobile && (
        <Chart simulationResults={simulationResults} />
      )}
    </div>
  );
};
