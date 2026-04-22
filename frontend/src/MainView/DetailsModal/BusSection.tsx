import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";
import { round } from "utils";

type BusSectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.bus }>;
};

const BusSection = ({ tripStep }: BusSectionProps) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const equations = [
      {
        equation: `CO₂eq = CO₂eq_{${t("equation.construction")}} + CO₂eq_{${t("equation.fuel")}}`,
        center: true,
      },
      {
        equation: `distance = ${tripStep.distance}\\; km`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          CO₂eq_{${t("equation.construction")}} &= \\text{coeff}_{${t("equation.construction")}} \\times ${t("equation.distance")} \\\\
                        &= ${tripStep.coeff_upstream} \\times ${tripStep.distance}\\; km \\\\
                        &= ${round(tripStep.coeff_upstream * tripStep.distance)}\\; kgCO_2eq
          \\end{aligned}`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          CO₂eq_{${t("equation.fuel")}} &= \\text{coeff}_{${t("equation.fuel")}} \\times ${t("equation.distance")}\\\\
                        &= ${tripStep.coeff_fuel}\\times ${tripStep.distance}\\; km \\\\
                        &= ${round(tripStep.coeff_fuel * tripStep.distance)}\\; kgCO_2eq
          \\end{aligned}`,
        center: true,
      },
      {
        equation: `CO₂eq = CO₂eq_{${t("equation.construction")}} + CO₂eq_{${t("equation.fuel")}} = ${tripStep.emissions}\\; kgCO_2eq`,
        center: true,
      },
    ];

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
          <h3 className="details-section-title">{t("bus.generalEquation")}</h3>
        </div>

        <p>{t("bus.generalExplanations")}</p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">{t("bus.distance")}</h3>
        </div>

        <p>{t("bus.distanceExplanations")}</p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            {t("bus.upstreamEmissions")}
          </h3>
        </div>

        <p>{t("bus.upstreamEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id="equation3" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">{t("bus.fuelEmissions")}</h3>
        </div>

        <p>{t("bus.fuelEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id="equation4" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">5</span>
          <h3 className="details-section-title">{t("bus.total")}</h3>
        </div>

        <div className="equation-box">
          <div id="equation5" className="blue-text" />
        </div>
      </section>
    </>
  );
};

export default BusSection;
