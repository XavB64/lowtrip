import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";
import { compact, round } from "utils";

const CompactElectricCarSection = ({
  tripStep,
  index,
}: ElectricCarSectionProps) => {
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
          <div id={`step-${index}-equation1`} />
        </div>

        <p>{t("ecar.electricityProductionExplanation1")}</p>
        <p>{t("ecar.electricityProductionExplanation2")}</p>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <h3 className="details-section-title">
            {t("numericalApplications")}
          </h3>
        </div>

        <div className="equation-box">
          <div id={`step-${index}-equation2`} />
          <div id={`step-${index}-equation3`} />
          {tripStep.emissionParts
            .filter(({ emissionSource }) => emissionSource !== "construction")
            .map((emissionPart, partIndex) => (
              <div
                id={`step-${index}-equation${4 + partIndex}`}
                key={emissionPart.emissionSource}
                className="equation-by-country"
              />
            ))}
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

const DetailedElectricCarSection = ({
  tripStep,
  index,
}: ElectricCarSectionProps) => {
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
                className="equation-by-country"
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

    const equations: { equation: string; displayMode?: boolean }[] = compact([
      {
        equation: `\\text{CO₂eq} = \\frac{\\text{CO₂eq}_{\\text{${t("equation.construction")}}} + \\sum_{\\text{${t("equation.country")}}} \\left(\\text{\\text{coeff}}_{\\text{${t("equation.country")}}} \\times \\text{${t("equation.distance")}}_{\\text{${t("equation.country")}}}\\right)}{\\text{nb}_{\\text{${t("equation.passengers")}}}}`,
      },
      {
        equation: `
          \\begin{aligned}
          \\text{CO₂eq}_{\\text{${t("equation.construction")}}} &= \\text{coeff}_{\\text{${t("equation.construction")}}} \\times \\text{${t("equation.distance")}}_{\\text{${t("equation.total")}}} \\\\
                        &= ${tripStep.coeff_upstream} \\times ${tripStep.distance}\\; \\text{km} \\\\ 
                        &= ${round(tripStep.coeff_upstream * tripStep.distance)}\\; \\text{kgCO₂eq}
          \\end{aligned}`,
      },
      {
        equation: `\\text{CO₂eq}_{\\text{${t("equation.country")}}} = \\text{coeff}_{\\text{${t("equation.fuel")}}} \\times \\left(1 + 0.04 \\times (\\text{nb}_{\\text{${t("equation.passengers")}}} - 1)\\right) \\times \\text{coeff}_{\\text{${t("equation.country")}}} \\times \\text{${t("equation.distance")}}_{\\text{${t("equation.country")}}}`,
      },
    ]);

    tripStep.emissionParts.forEach((emissionPart) => {
      if (emissionPart.emissionSource !== "construction") {
        const { emissionSource: country, coefficient, distance } = emissionPart;
        equations.push({
          equation: `\\text{CO₂eq}_{\\text{${country}}} = ${tripStep.coeff_fuel} \\times \\left(1 + 0.04 \\times (${tripStep.passengers_nb} - 1)\\right) \\times ${round(coefficient, 3)} \\times ${distance}\\; \\text{km} = ${round(coefficient * (1 + 0.04 * (tripStep.passengers_nb! - 1)) * distance * tripStep.coeff_fuel)}\\; \\text{kgCO₂eq}`,
          displayMode: false,
        });
      }
    });

    equations.push({
      equation: `\\text{CO₂eq} = \\frac{\\text{CO₂eq}_{\\text{${t("equation.construction")}}} + \\text{CO₂eq}_{\\text{${t("equation.fuel")}}}}{\\text{nb}_{\\text{${t("equation.passengers")}}}} = ${tripStep.emissions}\\; \\text{kgCO₂eq}`,
    });

    equations.map(({ equation, displayMode = true }, equationIndex) => {
      const element = document.getElementById(
        `step-${index}-equation${equationIndex + 1}`,
      );
      if (element) {
        katex.render(equation, element, { displayMode });
      }
    });
  }, [i18n.language, props]);

  return isDetailed ? (
    <DetailedElectricCarSection {...props} />
  ) : (
    <CompactElectricCarSection {...props} />
  );
};

export default ElectricCarSection;
