import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { Transport, TripStep } from "types";
import { compact, round } from "utils";

const SummarizedCarSection = ({ tripStep, index }: CarSectionProps) => {
  const { t } = useTranslation("detailsModal");

  return (
    <>
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">{index + 1}</span>
          <h3 className="details-section-title">
            {tripStep.departure} - {tripStep.arrival} {t('by')} {t('transportMeans.car')}
          </h3>
        </div>

        <p>{t("car.generalExplanations")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation1`} className="blue-text" />
        </div>

        <p>{t("car.fuelEmissionsExplanation")}</p>
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
          <div id={`step-${index}-equation4`} />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <h3 className="details-section-title">{t("total")}</h3>
        </div>

        <div className="equation-box">
          <div id={`step-${index}-equation5`} className="blue-text" />
        </div>
      </section>
    </>
  );
};

const DetailedCarSection = ({ index }: CarSectionProps) => {
  const { t } = useTranslation("detailsModal");

  return (
    <div className="space-y-4 text-sm">
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">1</span>
          <h3 className="details-section-title">{t("car.generalEquation")}</h3>
        </div>

        <p>{t("car.generalExplanations")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation1`} className="blue-text" />
        </div>
      </section>

      {/* Distance */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">{t("car.distance")}</h3>
        </div>

        <p>{t("car.distanceExplanations")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation2`} />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            {t("car.upstreamEmissions")}
          </h3>
        </div>

        <p>{t("car.upstreamEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation3`} />
        </div>
      </section>

      {/* Essence */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">{t("car.fuelEmissions")}</h3>
        </div>

        <p>{t("car.fuelEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation4`} />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">5</span>
          <h3 className="details-section-title">{t("total")}</h3>
        </div>

        <div className="equation-box">
          <div id={`step-${index}-equation5`} className="blue-text" />
        </div>
      </section>
    </div>
  );
};

type CarSectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.car }>;
  index: number;
};

const CarSection = ({
  isDetailed,
  ...props
}: CarSectionProps & {
  isDetailed: boolean;
}) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const { tripStep, index } = props;

    const equations = compact([
      {
        equation: `\\text{CO₂eq} = \\frac{\\text{CO₂eq}_{\\text{${t("equation.construction")}}} + \\text{CO₂eq}_{\\text{${t("equation.fuel")}}}}{\\text{nb}_{\\text{${t("equation.passengers")}}}}`,
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
          \\text{CO₂eq}_{\\text{${t("equation.construction")}}} &= \\text{coeff}_{\\text{${t("equation.construction")}}} \\times \\text{${t("equation.distance")}} \\\\
                        &= ${tripStep.coeff_upstream} \\times ${tripStep.distance}\\; \\text{km} \\\\ 
                        &= ${round(tripStep.coeff_upstream * tripStep.distance)}\\; \\text{kgCO₂eq}
          \\end{aligned}`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          \\text{CO₂eq}_{\\text{${t("equation.fuel")}}} &= \\text{coeff}_{\\text{${t("equation.fuel")}}} \\times \\left(1 + 0.04 \\times (\\text{nb}_{\\text{${t("equation.passengers")}}} - 1)\\right) \\times ${t("equation.distance")} \\\\
                    &=${tripStep.coeff_fuel} \\times (1 + 0.04 \\times (${tripStep.passengers_nb} - 1)) \\times ${tripStep.distance}\\; \\text{km} \\\\
                    &= ${round(tripStep.coeff_fuel * tripStep.distance * (1 + 0.04 * (tripStep.passengers_nb - 1)))}\\; \\text{kgCO₂eq}
          \\end{aligned}`,
        center: true,
      },
      {
        equation: `\\text{CO₂eq} = \\frac{\\text{CO₂eq}_{\\text{${t("equation.construction")}}} + \\text{CO₂eq}_{\\text{${t("equation.fuel")}}}}{\\text{nb}_{\\text{${t("equation.passengers")}}}} = ${tripStep.emissions}\\; \\text{kgCO₂eq}`,
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
    <DetailedCarSection {...props} />
  ) : (
    <SummarizedCarSection {...props} />
  );
};

export default CarSection;
