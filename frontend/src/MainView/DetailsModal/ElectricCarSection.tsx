import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";
import { compact, round } from "utils";

const SummarizedCarSection = ({ tripStep, index }: ElectricCarSectionProps) => {
  const { t } = useTranslation("detailsModal");

  return (
    <>
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">{index + 1}</span>
          <h3 className="details-section-title">
            {tripStep.departure} - {tripStep.arrival} {t("by")}{" "}
            {t("transportMeans.ecar")}
          </h3>
        </div>

        <p>{t("ecar.generalExplanations")}</p>

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
          <div id={`step-${index}-equation2`} />
          {tripStep.emissionParts
            .filter(({ emissionSource }) => emissionSource !== "construction")
            .map((emissionPart, partIndex) => (
              <div
                id={`step-${index}-equation${3 + partIndex}`}
                key={emissionPart.emissionSource}
              />
            ))}
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <h3 className="details-section-title">{t("total")}</h3>
        </div>

        <div className="equation-box">
          <div
            id={`step-${index}-equation${3 + tripStep.emissionParts.length - 1}`}
            className="blue-text"
          />
        </div>
      </section>
    </>
  );
};

const DetailedCarSection = ({ tripStep, index }: ElectricCarSectionProps) => {
  const { t } = useTranslation("detailsModal");

  return (
    <>
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">1</span>
          <h3 className="details-section-title">{t("ecar.generalEquation")}</h3>
        </div>

        <p>{t("ecar.generalExplanations")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation1`} className="blue-text" />
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
          <div id={`step-${index}-equation2`} />
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
          <div id={`step-${index}-equation3`} />
        </div>

        <p>{t("ecar.numericalApplications")}</p>

        <div className="equation-box">
          {tripStep.emissionParts
            .filter(({ emissionSource }) => emissionSource !== "construction")
            .map((emissionPart, partIndex) => (
              <div
                id={`step-${index}-equation${4 + partIndex}`}
                key={emissionPart.emissionSource}
              />
            ))}
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">{t("total")}</h3>
        </div>

        <div className="equation-box">
          <div
            id={`step-${index}-equation${4 + tripStep.emissionParts.length - 1}`}
            className="blue-text"
          />
        </div>
      </section>
    </>
  );
};

type ElectricCarSectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.ecar }>;
  index: number;
};

const ElectricCarSection = ({
  isDetailed,
  ...props
}: ElectricCarSectionProps & {
  isDetailed: boolean;
}) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const { tripStep, index } = props;

    const equations = compact([
      {
        equation: `CO₂eq = \\frac{CO₂eq_{${t("equation.construction")}} + \\sum_{${t("equation.country")}} \\left(\\text{coeff}_{${t("equation.country")}} \\times ${t("equation.distance")}{${t("equation.country")}}\\right)}{nb_{${t("equation.passengers")}}}`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          CO₂eq_{${t("equation.construction")}} &= \\text{coeff}_{${t("equation.construction")}} \\times ${t("equation.distance")}_{${t("equation.total")}} \\\\
                        &= ${tripStep.coeff_upstream} \\times ${tripStep.distance}\\; km \\\\ 
                        &= ${round(tripStep.coeff_upstream * tripStep.distance)}\\; \\text{kgCO₂eq}
          \\end{aligned}`,
        center: true,
      },
      isDetailed
        ? {
            equation: `CO_2eq_{${t("equation.country")}} = \\text{coeff}_{${t("equation.consommation")}} \\times \\left(1 + 0.04 \\times (nb_{${t("equation.passengers")}} - 1)\\right) \\times \\text{coeff}_{${t("equation.country")}} \\times ${t("equation.distance")}_{${t("equation.country")}}`,
            center: true,
          }
        : null,
    ]);

    tripStep.emissionParts.forEach((emissionPart) => {
      if (emissionPart.emissionSource !== "construction") {
        const { emissionSource: country, coefficient, distance } = emissionPart;
        equations.push({
          equation: `CO_2eq_{${country}} = ${tripStep.coeff_fuel} \\times \\left(1 + 0.04 \\times (${tripStep.passengers_nb} - 1)\\right) \\times ${round(coefficient, 3)} \\times ${distance}\\; km = ${round(coefficient * (1 + 0.04 * (tripStep.passengers_nb! - 1)) * distance * tripStep.coeff_fuel)}\\; \\text{kgCO₂eq}`,
          center: false,
        });
      }
    });

    equations.push({
      equation: `CO₂eq = \\frac{CO₂eq_{${t("equation.construction")}} + CO₂eq_{${t("equation.fuel")}}}{nb_{${t("equation.passengers")}}} = ${tripStep.emissions}\\; \\text{kgCO₂eq}`,
      center: true,
    });

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
    <DetailedCarSection {...props} />
  ) : (
    <SummarizedCarSection {...props} />
  );
};

export default ElectricCarSection;
