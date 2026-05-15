import { useEffect } from "react";

import katex from "katex";
import { useTranslation } from "react-i18next";

import i18n from "i18n";
import { TripStep, Transport } from "types";
import { round } from "utils";

const CompactHitchHikingSection = ({
  tripStep,
  index,
}: HitchHikingSectionProps) => {
  const { t } = useTranslation("detailsModal");

  return (
    <>
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">{index + 1}</span>
          <h3 className="details-section-title">
            {tripStep.departure} - {tripStep.arrival} {t('by')} {t('transportMeans.hitchHiking')}
          </h3>
        </div>

        <p>{t("hitchHiking.generalExplanations1")}</p>
        <br />
        <p>{t("hitchHiking.generalExplanations2")}</p>

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
          <div id={`step-${index}-equation3`} />
          <div id={`step-${index}-equation4`} />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <h3 className="details-section-title">{t("train.total")}</h3>
        </div>

        <div className="equation-box">
          <div id={`step-${index}-equation5`} className="blue-text" />
        </div>
      </section>
    </>
  );
};

const DetailedHitchHikingSection = ({ index }: HitchHikingSectionProps) => {
  const { t } = useTranslation("detailsModal");

  return (
    <>
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">1</span>
          <h3 className="details-section-title">
            {t("hitchHiking.generalEquation")}
          </h3>
        </div>

        <p>{t("hitchHiking.generalExplanations1")}</p>
        <br />
        <p>{t("hitchHiking.generalExplanations2")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation1`} className="blue-text" />
        </div>
      </section>

      {/* Distance */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">{t("hitchHiking.distance")}</h3>
        </div>

        <p>{t("hitchHiking.distanceExplanations")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation2`} />
        </div>
      </section>

      {/* Construction */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            {t("hitchHiking.upstreamEmissions")}
          </h3>
        </div>

        <p>{t("hitchHiking.upstreamEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation3`} />
        </div>
      </section>

      {/* Essence */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">
            {t("hitchHiking.fuelEmissions")}
          </h3>
        </div>

        <p>{t("hitchHiking.fuelEmissionsExplanation")}</p>

        <div className="equation-box">
          <div id={`step-${index}-equation4`} />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">5</span>
          <h3 className="details-section-title">{t("hitchHiking.total")}</h3>
        </div>

        <div className="equation-box">
          <div id={`step-${index}-equation5`} className="blue-text" />
        </div>
      </section>
    </>
  );
};

type HitchHikingSectionProps = {
  tripStep: Extract<TripStep, { transport: Transport.car }>;
  index: number;
};

const AutoStopSection = ({
  isDetailed,
  ...props
}: HitchHikingSectionProps & {
  isDetailed: boolean;
}) => {
  const { t } = useTranslation("detailsModal");

  useEffect(() => {
    const { tripStep, index } = props;

    const equations = [
      {
        equation: `CO₂eq = \\text{CO₂eq}_{\\text{${t("equation.construction")}}} + \\text{CO₂eq}_{\\text{${t("equation.fuel")}}}`,
        center: true,
      },
      {
        equation: `distance = ${tripStep.emissionParts[0].distance}\\; \\text{km}`,
        center: true,
      },
      {
        equation: `\\text{CO₂eq}_{\\text{${t("equation.construction")}}} = 0\\; \\text{kgCO₂eq}`,
        center: true,
      },
      {
        equation: `
          \\begin{aligned}
          \\text{CO₂eq}_{\\text{${t("equation.fuel")}}} &= \\text{coeff}_{\\text{${t("equation.fuel")}}} \\times0.04 \\times ${t("equation.distance")} \\\\
                    &=${tripStep.coeff_fuel} \\times 0.04 \\times ${tripStep.distance}\\; \\text{km} \\\\
                    &= ${round(tripStep.coeff_fuel * tripStep.distance * 0.04)}\\; \\text{kgCO₂eq}
          \\end{aligned}`,
        center: true,
      },
      {
        equation: `CO₂eq = \\text{CO₂eq}_{\\text{${t("equation.construction")}}} + \\text{CO₂eq}_{\\text{${t("equation.fuel")}}} = ${tripStep.emissions}\\; \\text{kgCO₂eq}`,
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

  return isDetailed ? (
    <DetailedHitchHikingSection {...props} />
  ) : (
    <CompactHitchHikingSection {...props} />
  );
};

export default AutoStopSection;
