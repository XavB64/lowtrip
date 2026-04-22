import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";
import { round } from "utils";

type ElectricCarSectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.ecar }>;
};

const ElectricCarSection = ({ tripStep }: ElectricCarSectionProps) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const equations = [
      {
        equation: `CO₂eq = \\frac{CO₂eq_{${t("equation.construction")}} + \\sum_{${t("equation.country")}} \\left(\\text{coeff}_{${t("equation.country")}} \\times ${t("equation.distance")}{${t("equation.country")}}\\right)}{nb_{${t("equation.passengers")}}}`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          CO₂eq_{${t("equation.construction")}} &= \\text{coeff}_{${t("equation.construction")}} \\times ${t("equation.distance")}_{${t("equation.total")}} \\\\
                        &= ${tripStep.coeff_upstream} \\times ${tripStep.distance}\\; km \\\\ 
                        &= ${round(tripStep.coeff_upstream * tripStep.distance)}\\; kgCO_2eq
          \\end{aligned}`,
        center: true,
      },
      {
        equation: `CO_2eq_{${t("equation.country")}} = \\text{coeff}_{${t("equation.consommation")}} \\times \\left(1 + 0.04 \\times (nb_{${t("equation.passengers")}} - 1)\\right) \\times \\text{coeff}_{${t("equation.country")}} \\times ${t("equation.distance")}_{${t("equation.country")}}`,
        center: true,
      },
    ];

    tripStep.emissionParts.forEach((emissionPart) => {
      if (emissionPart.emissionSource !== "construction") {
        const { emissionSource: country, coefficient, distance } = emissionPart;
        equations.push({
          equation: `CO_2eq_{${country}} = ${tripStep.coeff_fuel} \\times \\left(1 + 0.04 \\times (${tripStep.passengers_nb} - 1)\\right) \\times ${round(coefficient, 3)} \\times ${distance}\\; km = ${round(coefficient * (1 + 0.04 * (tripStep.passengers_nb! - 1)) * distance * tripStep.coeff_fuel)}\\; kgCO_2eq`,
          center: false,
        });
      }
    });

    equations.push({
      equation: `CO₂eq = \\frac{CO₂eq_{${t("equation.construction")}} + CO₂eq_{${t("equation.fuel")}}}{nb_{${t("equation.passengers")}}} = ${tripStep.emissions}\\; kgCO_2eq`,
      center: true,
    });

    equations.map(({ equation, center }, index) => {
      const element = document.getElementById(`equation${index + 1}`);
      if (element) {
        katex.render(equation, element, {
          displayMode: center,
        });
      }
    });
  }, [i18n.language, tripStep]);

  return (
    <>
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">1</span>
          <h3 className="details-section-title">{t("ecar.generalEquation")}</h3>
        </div>

        <p>{t("ecar.generalExplanations")}</p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">
            {t("ecar.upstreamEmissions")}
          </h3>
        </div>

        <p>{t("ecar.upstreamEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            {t("ecar.electricityProductionEmissions")}
          </h3>
        </div>

        <p>{t("ecar.electricityProductionExplanation1")}</p>
        <br />
        <p>{t("ecar.electricityProductionExplanation2")}</p>

        <div className="equation-box">
          <div id="equation3" />
        </div>

        <p>{t("ecar.numericalApplications")}</p>

        <div className="equation-box">
          {tripStep.emissionParts
            .filter(({ emissionSource }) => emissionSource !== "construction")
            .map((emissionPart, index) => (
              <div
                id={`equation${4 + index}`}
                key={emissionPart.emissionSource}
              />
            ))}
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">{t("ecar.total")}</h3>
        </div>

        <div className="equation-box">
          <div
            id={`equation${4 + tripStep.emissionParts.length - 1}`}
            className="blue-text"
          />
        </div>
      </section>
    </>
  );
};

export default ElectricCarSection;
