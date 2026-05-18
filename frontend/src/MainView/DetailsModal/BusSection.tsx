import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";
import { round } from "utils";

const DetailedBusSection = ({ index }: BusSectionProps) => {
  const { t } = useTranslation("detailsModal");

  return (
    <>
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">1</span>
          <h3 className="details-section-title">{t("bus.generalEquation")}</h3>
        </div>

        <p>{t("bus.generalExplanations")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation1`} className="blue-text" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">{t("bus.distance")}</h3>
        </div>

        <p>{t("bus.distanceExplanations")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation2`} />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            {t("bus.upstreamEmissions")}
          </h3>
        </div>

        <p>{t("bus.upstreamEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation3`} />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">{t("bus.fuelEmissions")}</h3>
        </div>

        <p>{t("bus.fuelEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation4`} />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">5</span>
          <h3 className="details-section-title">{t("bus.total")}</h3>
        </div>

        <div className="equation-box">
          <div id={`step-${index}-equation5`} className="blue-text" />
        </div>
      </section>
    </>
  );
};

type BusSectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.bus }>;
  index: number;
};

const BusSection = (props: BusSectionProps) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const { tripStep, index } = props;

    const equations = [
      {
        equation: `\\text{kgCO₂eq} = \\text{CO₂eq}_{\\text{${t("equation.construction")}}} + \\text{CO₂eq}_{\\text{\\text{${t("equation.fuel")}}}}`,
        center: true,
      },
      {
        equation: `\\text{distance}= ${tripStep.distance}\\; \\text{km}`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          \\text{CO₂eq}_{\\text{${t("equation.construction")}}} &= \\text{coeff}_{\\text{${t("equation.construction")}}} \\times \\text{${t("equation.distance")}} \\\\
                        &= ${tripStep.coeff_upstream} \\times ${tripStep.distance}\\; \\text{km} \\\\
                        &= ${round(tripStep.coeff_upstream * tripStep.distance)}\\; \\text{kgCO₂eq}
          \\end{aligned}`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          \\text{CO₂eq}_{\\text{${t("equation.fuel")}}} &= \\text{coeff}_{\\text{${t("equation.fuel")}}} \\times \\text{${t("equation.distance")}}\\\\
                        &= ${tripStep.coeff_fuel}\\times ${tripStep.distance}\\; \\text{km} \\\\
                        &= ${round(tripStep.coeff_fuel * tripStep.distance)}\\; \\text{kgCO₂eq}
          \\end{aligned}`,
        center: true,
      },
      {
        equation: `\\text{kgCO₂eq} = \\text{CO₂eq}_{\\text{${t("equation.construction")}}} + \\text{CO₂eq}_{\\text{${t("equation.fuel")}}} = ${tripStep.emissions}\\; \\text{kgCO₂eq}`,
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
  }, [i18n.language, props]);

  return <DetailedBusSection {...props} />;
};

export default BusSection;
