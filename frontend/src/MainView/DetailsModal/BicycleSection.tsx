import { useEffect } from "react";

import i18n from "i18n";
import katex from "katex";

import { TripStep } from "types";

type BicycleSectionProps = {
  tripStep: TripStep;
};

const BicycleSection = ({ tripStep }: BicycleSectionProps) => {
  // Render the LaTeX equation using KaTeX
  useEffect(() => {
    const emissionsPart = tripStep.emissionParts[0];

    // add equations
    const equations = [
      {
        equation: "CO_2eq = coeff_{velo} \\times distance",
        center: true,
      },
      {
        equation: `CO_2eq = ${emissionsPart.coefficient} \\times ${emissionsPart.distance}\\; km = ${tripStep.emissions}\\; kgCO_2eq`,
        center: true,
      },
    ];

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
      {" "}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">1</span>
          <h3 className="details-section-title">
            ÉQUATION GÉNÉRALE & RÉSULTATS
          </h3>
        </div>

        <p>
          Les émissions totales de CO₂eq du trajet sont obtenu en multipliant la
          distance parcourrue par un coefficient d'emission qui ne tient compte
          que de la fabrication du velo (fourni par ???).
        </p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>

        <p>Application numerique</p>
        <div className="equation-box">
          <div id="equation2" className="blue-text" />
        </div>
      </section>
    </>
  );
};

export default BicycleSection;
