import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";
import { round } from "utils";

type TrainSectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.train }>;
};

const TrainSection = ({ tripStep }: TrainSectionProps) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const emissionsParts = tripStep.emissionParts;

    const equations = [
      {
        equation: `\\text{CO₂eq} = \\text{coeff}_{\\text{${t("equation.infrastructure")}}} \\times \\text{${t("equation.distance")}}_{\\text{${t("equation.total")}}} + \\sum_{\\text{${t("equation.country")}}} \\text{coeff}_{\\text{${t("equation.country")}}} \\times \\text{${t("equation.distance")}}_{\\text{${t("equation.country")}}}`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          \\text{CO₂eq}_{\\text{${t("equation.infrastructure")}}} &= \\text{coeff}_{\\text{${t("equation.infrastructure")}}} \\times \\text{${t("equation.distance")}}_{\\text{${t("equation.total")}}} \\\\
                  &= ${tripStep.coeff_upstream} \\times ${tripStep.distance}\\; \\text{km} \\\\
                  &= ${round(tripStep.coeff_upstream * tripStep.distance)}\\; \\text{kgCO₂eq}
          \\end{aligned}
        `,
        center: true,
      },
      {
        equation: `\\text{CO₂eq}_{\\text{${t("equation.country")}}} = \\text{coeff}_{\\text{${t("equation.country")}}} \\times \\text{${t("equation.distance")}}_{\\text{${t("equation.country")}}}`,
        center: true,
      },
    ];

    emissionsParts.forEach((emissionPart) => {
      if (emissionPart.emissionSource !== "infra") {
        const {
          emissionSource: country,
          coefficient,
          distance,
          emissions,
        } = emissionPart;
        equations.push({
          equation: `\\text{CO₂eq}_{\\text{${country}}} = ${coefficient} \\times ${distance}\\; \\text{km} = ${emissions}\\; \\text{kgCO₂eq}`,
          center: false,
        });
      }
    });

    equations.push({
      equation: `\\text{CO₂eq} = \\text{CO₂eq}_{\\text{${t("equation.infrastructure")}}} + \\sum_{\\text{${t("equation.country")}}} \\text{CO₂eq}_{\\text{${t("equation.country")}}} = ${tripStep.emissions}\\; \\text{kgCO₂eq}`,
      center: true,
    });

    // render equations
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
            {t("train.generalEquation")}
          </h3>
        </div>

        <p>{t("train.generalExplanations1")}</p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>

        <p>{t("train.generalExplanations2")}</p>
        <br />
        <p>{t("train.generalExplanations3")}</p>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">
            {t("train.upstreamEmissions")}
          </h3>
        </div>

        <p>{t("train.upstreamEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            {t("train.tractionEnergyEmissions")}
          </h3>
        </div>

        <p>{t("train.tractionEnergyExplanation1")}</p>
        <br />
        <p>{t("train.tractionEnergyExplanation2")}</p>

        <div className="equation-box">
          <div id="equation3" />
        </div>

        <p>{t("train.numericalApplications")}</p>

        <div className="equation-box">
          {tripStep.emissionParts
            .filter(({ emissionSource }) => emissionSource !== "infra")
            .map((emissionPart, index) => (
              <div
                id={`equation${4 + index}`}
                key={emissionPart.emissionSource}
                className="equation-by-country"
              />
            ))}
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">{t("train.total")}</h3>
        </div>

        <div className="equation-box">
          <div
            id={`equation${4 + tripStep.emissionParts.length - 1}`}
            className="blue-text"
          />
        </div>
      </section>
    </>
  );
};

export default TrainSection;
