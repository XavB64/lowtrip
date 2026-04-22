import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";

type FerrySectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.ferry }>;
};

const FerrySection = ({ tripStep }: FerrySectionProps) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const equations = [
      {
        equation: `CO₂eq_{${t("equation.cruise")}} = \\text{coeff}_{${t("equation.cruise")}} \\times ${t("equation.distance")}`,
        center: true,
      },
      {
        equation: `${t("equation.distance")} = ${tripStep.distance}\\; km`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          CO₂eq_{${t("equation.cruise")}} &= \\text{coeff}_{${t("equation.cruise")}} \\times ${t("equation.distance")} \\\\
                        &= ${tripStep.coeff_total} \\times ${tripStep.distance}\\; km \\\\ 
                        &= ${tripStep.emissions}\\; kgCO_2eq
          \\end{aligned}`,
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
            {t("ferry.generalEquation")}
          </h3>
        </div>

        <p>{t("ferry.generalExplanations")}</p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>
      </section>

      {/* Distance */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">{t("ferry.distance")}</h3>
        </div>

        <p>{t("ferry.distanceExplanations1")}</p>
        <br />
        <p>{t("ferry.distanceExplanations2")}</p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      {/* Total */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            {t("ferry.cruiseEmissions")}
          </h3>
        </div>

        <p>{t("ferry.cruiseEmissionsExplanations1")}</p>
        <br />
        <p>{t("ferry.cruiseEmissionsExplanations2")}</p>

        <div className="equation-box">
          <div id="equation3" className="blue-text" />
        </div>
      </section>
    </>
  );
};

export default FerrySection;
