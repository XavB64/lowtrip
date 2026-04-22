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
        equation: `CO₂eq = CO₂eq_{CO₂} + CO₂eq_{${t("equation.nonCO2")}}`,
        center: true,
      },
      {
        equation: `${t("equation.distance")} = ${distance} \\times ${coeff_path_detour} = ${realDistance} km`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          CO₂eq_{CO₂} &= (coeff_{${t("equation.combustion")}} + coeff_{${t("equation.upstream")}}) \\times ${t("equation.distance")} + ${t("equation.holding")} \\\\
                         &= (${coeff_fuel} + ${coeff_upstream}) \\times ${realDistance}\\; km + ${holding}\\; kgCO_2eq \\\\
                         &= ${round((coeff_fuel + coeff_upstream) * realDistance + holding)}\\; kgCO_2eq
          \\end{aligned}
          `,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          CO₂eq_{non-CO₂} &= (coeff_{${t("equation.combustion")}} \\times ${t("equation.distance")}) \\times coeff_{${t("equation.contrails")}} \\\\
                         &=  (${coeff_fuel} \\times ${realDistance}\\; km) \\times ${coeff_contrails} \\\\
                         &= ${round(coeff_fuel * realDistance * coeff_contrails)}\\; kgCO_2eq
          \\end{aligned}
          `,
        center: true,
      },
      {
        equation: `CO_2eq = CO₂eq_{CO₂} + CO₂eq_{non-CO₂} = ${tripStep.emissions}\\; kgCO_2eq`,
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
