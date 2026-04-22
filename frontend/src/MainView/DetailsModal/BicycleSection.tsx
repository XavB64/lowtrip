import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";

type BicycleSectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.bicycle }>;
};

const BicycleSection = ({ tripStep }: BicycleSectionProps) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const equations = [
      {
        equation: `CO_2eq = \\text{coeff}_{${t("equation.bicycle")}} \\times ${t("equation.distance")}`,
        center: true,
      },
      {
        equation: `CO_2eq = ${tripStep.coeff_upstream} \\times ${tripStep.distance}\\; km = ${tripStep.emissions}\\; kgCO_2eq`,
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
            {t("bicycle.generalEquation")}
          </h3>
        </div>

        <p>{t("bicycle.explanations")}</p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>

        <p> {t("bicycle.numericalApplication")}</p>
        <div className="equation-box">
          <div id="equation2" className="blue-text" />
        </div>
      </section>
    </>
  );
};

export default BicycleSection;
