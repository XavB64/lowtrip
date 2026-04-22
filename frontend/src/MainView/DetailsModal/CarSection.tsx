import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";
import { round } from "utils";

type CarSectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.car }>;
};

const CarSection = ({ tripStep }: CarSectionProps) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const equations = [
      {
        equation: `CO₂eq = \\frac{CO₂eq_{${t("equation.construction")}} + CO₂eq_{${t("equation.fuel")}}}{nb_{${t("equation.passengers")}}}`,
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
          CO₂eq_{${t("equation.fuel")}} &= \\text{coeff}_{${t("equation.fuel")}} \\times \\left(1 + 0.04 \\times (nb_{${t("equation.passengers")}} - 1)\\right) \\times ${t("equation.distance")} \\\\
                    &=${tripStep.coeff_fuel} \\times (1 + 0.04 \\times (${tripStep.passengers_nb} - 1)) \\times ${tripStep.distance}\\; km \\\\
                    &= ${round(tripStep.coeff_fuel * tripStep.distance * (1 + 0.04 * (tripStep.passengers_nb - 1)))}\\; kgCO_2eq
          \\end{aligned}`,
        center: true,
      },
      {
        equation: `CO₂eq = \\frac{CO₂eq_{${t("equation.construction")}} + CO₂eq_{${t("equation.fuel")}}}{nb_{${t("equation.passengers")}}} = ${tripStep.emissions}\\; kgCO_2eq`,
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
    <div className="space-y-4 text-sm">
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">1</span>
          <h3 className="details-section-title">{t("car.generalEquation")}</h3>
        </div>

        <p>{t("car.generalExplanations")}</p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>
      </section>

      {/* Distance */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">{t("car.distance")}</h3>
        </div>

        <p>{t("car.distanceExplanations")}</p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            {t("car.upstreamEmissions")}
          </h3>
        </div>

        <p>{t("car.upstreamEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id="equation3" />
        </div>
      </section>

      {/* Essence */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">{t("car.fuelEmissions")}</h3>
        </div>

        <p>{t("car.fuelEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id="equation4" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">5</span>
          <h3 className="details-section-title">{t("car.total")}</h3>
        </div>

        <div className="equation-box">
          <div id="equation5" className="blue-text" />
        </div>
      </section>
    </div>
  );
};

type AutoStopSectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.car }>;
};

export const AutoStopSection = ({ tripStep }: AutoStopSectionProps) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const equations = [
      {
        equation: `CO₂eq = CO₂eq_{${t("equation.construction")}} + CO₂eq_{${t("equation.fuel")}}`,
        center: true,
      },
      {
        equation: `distance = ${tripStep.emissionParts[0].distance}\\; km`,
        center: true,
      },
      {
        equation: `CO₂eq_{${t("equation.construction")}} = 0\\; kgCO_2eq`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          CO₂eq_{${t("equation.fuel")}} &= \\text{coeff}_{${t("equation.fuel")}} \\times0.04 \\times ${t("equation.distance")} \\\\
                    &=${tripStep.coeff_fuel} \\times 0.04 \\times ${tripStep.distance}\\; km \\\\
                    &= ${round(tripStep.coeff_fuel * tripStep.distance * 0.04)}\\; kgCO_2eq
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
    <div className="space-y-4 text-sm">
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">1</span>
          <h3 className="details-section-title">
            {t("hitchHiking.generalEquation")}
          </h3>
        </div>

        <p>{t("hitchHiking.generalExplanations1")}</p>
        <br />
        <p>{t("hitchHiking.generalExplanations2")}</p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>
      </section>

      {/* Distance */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">{t("hitchHiking.distance")}</h3>
        </div>

        <p>{t("hitchHiking.distanceExplanations")}</p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      {/* Construction */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            {t("hitchHiking.upstreamEmissions")}
          </h3>
        </div>

        <p>{t("hitchHiking.upstreamEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id="equation3" />
        </div>
      </section>

      {/* Essence */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">
            {t("hitchHiking.fuelEmissions")}
          </h3>
        </div>

        <p>{t("hitchHiking.fuelEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id="equation4" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">5</span>
          <h3 className="details-section-title">{t("hitchHiking.total")}</h3>
        </div>

        <div className="equation-box">
          <div id="equation5" className="blue-text" />
        </div>
      </section>
    </div>
  );
};

export default CarSection;
