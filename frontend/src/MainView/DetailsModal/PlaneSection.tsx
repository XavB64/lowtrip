import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";
import { round } from "utils";

type PlaneSectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.plane }>;
};

const PlaneSection = ({ tripStep }: PlaneSectionProps) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const {
      distance,
      coeff_fuel,
      coeff_upstream,
      coeff_contrails,
      coeff_path_detour,
      holding,
    } = tripStep;

    const realDistance = Math.round(distance * coeff_path_detour);

    const equations = [
      {
        equation: `\\text{CO₂eq} = \\text{CO₂eq}_{\\text{CO₂}} + \\text{CO₂eq}_{\\text{${t("equation.nonCO2")}}}`,
        center: true,
      },
      {
        equation: `\\text{${t("equation.distance")}} = \\text{${distance}} \\times ${coeff_path_detour} = ${realDistance} \\text{km}`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          \\text{CO₂eq}_{CO₂} &= (\\text{coeff}_{\\text{${t("equation.combustion")}}} + \\text{coeff}_{\\text{${t("equation.upstream")}}}) \\times \\text{${t("equation.distance")}} + \\text{${t("equation.holding")}} \\\\
                         &= (${coeff_fuel} + ${coeff_upstream}) \\times ${realDistance}\\; \\text{km} + ${holding}\\; \\text{kgCO₂eq} \\\\
                         &= ${round((coeff_fuel + coeff_upstream) * realDistance + holding)}\\; \\text{kgCO₂eq}
          \\end{aligned}
          `,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          \\text{CO₂eq}_{\\text{${t("equation.nonCO2")}}} &= (\\text{coeff}_{\\text{${t("equation.combustion")}}} \\times \\text{${t("equation.distance")}}) \\times \\text{coeff}_{\\text{${t("equation.contrails")}}} \\\\
                         &=  (${coeff_fuel} \\times ${realDistance}\\; \\text{km}) \\times ${coeff_contrails} \\\\
                         &= ${round(coeff_fuel * realDistance * coeff_contrails)}\\; \\text{kgCO₂eq}
          \\end{aligned}
          `,
        center: true,
      },
      {
        equation: `\\text{CO₂eq} = \\text{CO₂eq}_{CO₂} + \\text{CO₂eq}_{\\text{${t("equation.nonCO2")}}} = ${tripStep.emissions}\\; \\text{kgCO₂eq}`,
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
          <h3 className="details-section-title">
            {t("plane.generalEquation")}
          </h3>
        </div>

        <p>{t("plane.generalExplanations1")}</p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>
        <p>{t("plane.generalExplanations2")}</p>
      </section>

      {/* Distance */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">{t("plane.distance")}</h3>
        </div>

        <p>
          {t("plane.distanceExplanations", {
            detour_coeff: round((tripStep.coeff_path_detour - 1) * 100),
          })}
        </p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      {/* CO2 */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">{t("plane.CO2emissions")}</h3>
        </div>

        <p>
          {t("plane.CO2emissionsExplanations", { holding: tripStep.holding })}
        </p>

        <div className="equation-box">
          <div id="equation3" />
        </div>
      </section>

      {/* Non CO2 */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">
            {t("plane.nonCO2emissions")}
          </h3>
        </div>

        <p>{t("plane.nonCO2emissionsExplanations1")}</p>
        <br />
        <p>
          {t("plane.nonCO2emissionsExplanations2", {
            coeff_contrails: tripStep.coeff_contrails,
          })}
        </p>

        <div className="equation-box">
          <div id="equation4" />
        </div>
      </section>

      {/* Total */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">5</span>
          <h3 className="details-section-title">{t("plane.total")}</h3>
        </div>

        <div className="equation-box">
          <div id="equation5" className="blue-text" />
        </div>
      </section>
    </>
  );
};

export default PlaneSection;
