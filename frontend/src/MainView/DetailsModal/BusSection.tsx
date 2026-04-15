import { useEffect } from "react";

import i18n from "i18n";
import katex from "katex";

import { TripStep } from "types";

type BusSectionProps = {
  tripStep: TripStep;
};

const BusSection = ({ tripStep }: BusSectionProps) => {
  // Render the LaTeX equation using KaTeX
  useEffect(() => {
    const emissionsParts = tripStep.emissionParts;

    // add equations
    const equations = [
      {
        equation: "CO₂eq = CO₂eq_{construction} + CO₂eq_{essence}",
        center: true,
      },
      {
        equation: `distance = ${tripStep.emissionParts[0].distance}\\; km`,
        center: true,
      },
    ];

    emissionsParts.forEach((emissionPart) => {
      if (emissionPart.emissionSource === "construction") {
        equations.push({
          equation: `
          \\begin{aligned}
          CO₂eq_{construction} &= coeff_{construction} \\times distance \\\\
                        &= ${emissionPart.coefficient} \\times ${emissionPart.distance}\\; km \\\\
                        &= ${emissionPart.emissions}\\; kgCO_2eq
          \\end{aligned}`,
          center: true,
        });
      } else {
        equations.push({
          equation: `
          \\begin{aligned}
          CO₂eq_{essence} &= coeff_{essence} \\times distance\\\\
                        &= ${emissionPart.coefficient}\\times ${emissionPart.distance}\\; km \\\\
                        &= ${emissionPart.emissions}\\; kgCO_2eq
          \\end{aligned}`,
          center: true,
        });
      }
    });

    equations.push({
      equation: `CO₂eq = CO₂eq_{construction} + CO₂eq_{essence} = ${tripStep.emissions}\\; kgCO_2eq`,
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
          <h3 className="details-section-title">ÉQUATION GÉNÉRALE</h3>
        </div>

        <p>
          Les émissions totales de CO₂eq sont calculées en additionnant les
          émissions liées à la construction (véhicule et infrastructures) et les
          émissions liées à la consommation de carburant :
        </p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">DISTANCE</h3>
        </div>

        <p>
          La distance est calculée à partir d’itinéraires issus d’OpenStreetMap
          Routing, basés sur les données OSM.
        </p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            EMISSIONS LIEES A LA CONSTRUCTION
          </h3>
        </div>

        <p>
          Les émissions liées à la construction (bus et infrastructures) sont
          calculées en multipliant la distance par un coefficient issu de
          l’ADEME.
        </p>

        <div className="equation-box">
          <div id="equation3" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">
            EMISSIONS LIEES A LA CONSOMMATION D'ESSENCE
          </h3>
        </div>

        <p>
          Les émissions liées à la consommation de carburant sont calculées en
          multipliant la distance par un coefficient issu de l’ADEME.
        </p>

        <div className="equation-box">
          <div id="equation4" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">5</span>
          <h3 className="details-section-title">TOTAL</h3>
        </div>

        <div className="equation-box">
          <div id="equation5" className="blue-text" />
        </div>
      </section>
    </>
  );
};

export default BusSection;
