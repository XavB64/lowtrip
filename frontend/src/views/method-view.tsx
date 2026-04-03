// Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { useEffect } from "react";

import i18n from "i18next";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useTranslation } from "react-i18next";

import MethodologyPdf from "../assets/lowtrip_methodology.pdf";
import "./MethodView.scss";

const CALCULATION_METHOD_BY_TRANSPORT = [
  { transport: "train", method: "dataOpenstreetmap" },
  { transport: "car-ecar-bus", method: "dataOpenstreetmap" },
  { transport: "bike", method: "dataOpenstreetmap" },
  { transport: "plane", method: "dataGeodesic" },
  { transport: "ferry-sail", method: "dataApproximation" },
];

const TRANSPORTS_FOR_EMISSION_FACTORS_VARIABLES = [
  "train",
  "bus-bike",
  "car",
  "ecar",
  "plane",
  "ferry",
];

const LIFECYCLE_EMISSIONS_BY_TRANSPORT = [
  { transport: "train", use: true, production: false, infrastructure: true },
  {
    transport: "car-ecar-bus",
    use: true,
    production: true,
    infrastructure: false,
  },
  {
    transport: "bike",
    use: false,
    production: true,
    infrastructure: "unknown",
  },
  { transport: "plane", use: true, production: false, infrastructure: false },
  {
    transport: "ferry",
    use: true,
    production: false,
    infrastructure: "unknown",
  },
];

const MethodView = () => {
  const { t } = useTranslation();

  const equation =
    i18n.language === "fr"
      ? "CO_2eq = \\sum_{étape} Distance(km) \\times Facteur \\: d'Émission(kgCO2eq/km)"
      : "CO_2eq = \\sum_{step} Distance(km) \\times Emission \\: Factor(kgCO2eq/km)";

  // Render the LaTeX equation using KaTeX
  useEffect(() => {
    const element = document.getElementById("equation");
    if (element) {
      katex.render(equation, element);
    }
  }, [equation]);

  return (
    <div className="method-view">
      <h1 className="method__title">{t("method.introduction.title")}</h1>

      <p>{t("method.introduction.text1")}</p>
      <p>{t("method.introduction.text2")}</p>

      <p className="mb-lg">
        {t("method.introduction.text3")}{" "}
        <a
          href={MethodologyPdf}
          target="_blank"
          rel="noreferrer"
          className="link"
        >
          {t("method.introduction.text4")}
        </a>
        {t("method.introduction.text5")}
      </p>

      <h2 className="method__subtitle">
        {t("method.howEmissionsAreComputed.title")}
      </h2>

      <p>{t("method.howEmissionsAreComputed.text1")}</p>

      <div id="equation" />

      <h2 className="method__subtitle">
        {t("method.distanceEstimation.title")}
      </h2>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t("method.distanceEstimation.table.title1")}</th>
              <th>{t("method.distanceEstimation.table.title2")}</th>
            </tr>
          </thead>
          <tbody>
            {CALCULATION_METHOD_BY_TRANSPORT.map(({ transport, method }) => (
              <tr key={transport}>
                <td className="highlight">
                  {t(`method.distanceEstimation.table.${transport}`)}
                </td>
                <td>{t(`method.distanceEstimation.table.${method}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="method__subtitle">{t("method.emissionFactors.title")}</h2>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t("method.emissionFactors.table1.title1")}</th>
              <th>{t("method.emissionFactors.table1.title2")}</th>
              <th>{t("method.emissionFactors.table1.title3")}</th>
            </tr>
          </thead>
          <tbody>
            {TRANSPORTS_FOR_EMISSION_FACTORS_VARIABLES.map((transport) => (
              <tr key={transport}>
                <td className="highlight">
                  {t(`method.emissionFactors.table1.${transport}.label`)}
                </td>
                <td>
                  {t(`method.emissionFactors.table1.${transport}.variables`)}
                </td>
                <td>
                  {t(`method.emissionFactors.table1.${transport}.explanations`)
                    .split(";")
                    .map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="emission-factors-text">
        {t("method.emissionFactors.text1")}
      </p>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t("method.emissionFactors.table2.title1")}</th>
              <th>{t("method.emissionFactors.table2.title2")}</th>
              <th>{t("method.emissionFactors.table2.title3")}</th>
              <th>{t("method.emissionFactors.table2.title4")}</th>
            </tr>
          </thead>
          <tbody>
            {LIFECYCLE_EMISSIONS_BY_TRANSPORT.map(
              ({ transport, use, production, infrastructure }) => (
                <tr key={transport}>
                  <td className="highlight">
                    {t(`method.emissionFactors.table2.${transport}`)}
                  </td>
                  <td>{use ? "✔" : "-"}</td>
                  <td>{production ? "✔" : "-"}</td>
                  <td>
                    {infrastructure == "unknown"
                      ? t("method.emissionFactors.table2.dataNotFound")
                      : infrastructure
                        ? "✔"
                        : "-"}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MethodView;
