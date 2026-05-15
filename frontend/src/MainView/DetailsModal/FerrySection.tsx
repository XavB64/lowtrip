import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";
import { compact } from "utils";

const CompactFerrySection = ({ tripStep, index }: FerrySectionProps) => {
  const { t } = useTranslation("detailsModal");

  return (
    <>
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">{index + 1}</span>
          <h3 className="details-section-title">
            {tripStep.departure} - {tripStep.arrival} {t("by")}{" "}
            {t("transportMeans.ferry")}
          </h3>
        </div>

        <p>{t("sail.generalExplanations")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation1`} className="blue-text" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <h3 className="details-section-title">
            {t("numericalApplications")}
          </h3>
        </div>

        <div className="equation-box">
          <div id={`step-${index}-equation2`} className="blue-text" />
        </div>
      </section>
    </>
  );
};

const DetailedFerrySection = ({ index }: FerrySectionProps) => {
  const { t } = useTranslation("detailsModal");

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
          <div id={`step-${index}-equation1`} className="blue-text" />
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
          <div id={`step-${index}-equation2`} />
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
          <div id={`step-${index}-equation3`} className="blue-text" />
        </div>
      </section>
    </>
  );
};

type FerrySectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.ferry }>;
  index: number;
};

const FerrySection = ({
  isDetailed,
  ...props
}: FerrySectionProps & {
  isDetailed: boolean;
}) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const { tripStep, index } = props;
    const equations = compact([
      {
        equation: `\\text{CO₂eq}_{\\text{${t("equation.cruise")}}} = \\text{coeff}_{\\text{${t("equation.cruise")}}} \\times \\text{${t("equation.distance")}}`,
        center: true,
      },
      isDetailed
        ? {
            equation: `\\text{${t("equation.distance")}} = ${tripStep.distance}\\; \\text{km}`,
            center: true,
          }
        : null,
      {
        equation: `
          \\begin{aligned}
          \\text{CO₂eq}_{\\text{${t("equation.cruise")}}} &= \\text{coeff}_{\\text{${t("equation.cruise")}}} \\times \\text{${t("equation.distance")}} \\\\
                        &= ${tripStep.coeff_total} \\times ${tripStep.distance}\\; \\text{km} \\\\ 
                        &= ${tripStep.emissions}\\; \\text{kgCO₂eq}
          \\end{aligned}`,
        center: true,
      },
    ]);

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
  }, [i18n.language, props]);

  return isDetailed ? (
    <DetailedFerrySection {...props} />
  ) : (
    <CompactFerrySection {...props} />
  );
};

export default FerrySection;
