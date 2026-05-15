import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";

type BicycleSectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.bicycle }>;
  index: number;
};

const BicycleSection = ({
  isDetailed,
  tripStep,
  index,
}: BicycleSectionProps & {
  isDetailed: boolean;
}) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const equations = [
      {
        equation: `\\text{CO₂eq} = \\text{coeff}_{\\text{${t("equation.bicycle")}}} \\times \\text{${t("equation.distance")}}`,
        center: true,
      },
      {
        equation: `\\text{CO₂eq} = ${tripStep.coeff_upstream} \\times ${tripStep.distance}\\; \\text{km} = ${tripStep.emissions}\\; \\text{kgCO₂eq}`,
        center: true,
      },
    ];

    equations.map(({ equation, center }, equationIndex) => {
      const element = document.getElementById(
        `step-${index}-equation${equationIndex + 1}`,
      );
      if (element) {
        katex.render(equation, element, {
          displayMode: center,
        });
      }
    });
  }, [i18n.language, tripStep]);

  return (
    <section className="details-section">
      <div className="details-section-header">
        <span className="details-section-step">{index + 1}</span>
        <h3 className="details-section-title">
          {isDetailed
            ? t("bicycle.generalEquation")
            : `${tripStep.departure} - ${tripStep.arrival} ${t("by")} ${t("transportMeans.bicycle")}`}
        </h3>
      </div>

      <p>{t("bicycle.explanations")}</p>

      <div className="equation-box">
        <div id={`step-${index}-equation1`} className="blue-text" />
      </div>

      <p> {t("bicycle.numericalApplication")}</p>
      <div className="equation-box">
        <div id={`step-${index}-equation2`} className="blue-text" />
      </div>
    </section>
  );
};

export default BicycleSection;
