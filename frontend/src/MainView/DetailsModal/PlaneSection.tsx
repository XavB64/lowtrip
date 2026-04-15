import { useEffect } from "react";

import i18n from "i18n";
import katex from "katex";

import { TripStep } from "types";

type PlaneSectionProps = {
  tripStep: TripStep;
};

const PlaneSection = ({ tripStep }: PlaneSectionProps) => {
  // Render the LaTeX equation using KaTeX
  useEffect(() => {
    const emissionsParts = tripStep.emissionParts;

    // add equations
    const equations = [
      {
        equation: "CO₂eq = CO₂eq_{CO₂} + CO₂eq_{non-CO₂}",
        center: true,
      },
      {
        equation: `Distance = ??? \\times (1 + 0.076) = ${tripStep.emissionParts[0].distance} km`,
        center: true,
      },
    ];
    // CO2_emissions = (coeff_combustion + coeff_upstream) × Distance + Holding

    emissionsParts.forEach((emissionPart) => {
      if (emissionPart.emissionSource === "kerosene") {
        equations.push({
          equation: `
          \\begin{aligned}
          CO₂eq_{CO₂} &= (coeff_{combustion} + coeff_{upstream}) \\times Distance + Holding \\\\
                         &= ??? \\times ${emissionPart.distance}\\; km + 3.81\\; kgCO_2eq \\\\
                         &= ${emissionPart.emissions}\\; kgCO_2eq
          \\end{aligned}
          `,
          center: true,
        });
      } else {
        equations.push({
          equation: `
          \\begin{aligned}
          CO₂eq_{non-CO₂} &= (coeff_{combustion} \\times Distance) \\times 2 \\\\
                         &= (??? \\times ${emissionPart.distance}\\; km) \\times 2 \\\\
                         &= ${emissionPart.emissions}\\; kgCO_2eq
          \\end{aligned}
          `,
          center: true,
        });
      }
    });

    equations.push({
      equation: `CO_2eq = CO₂eq_{CO₂} + CO₂eq_{non-CO₂} = ${tripStep.emissions}\\; kgCO_2eq`,
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
          émissions de CO₂ (liées à la combustion du carburant) et les émissions
          non-CO₂ (comme les traînées de condensation) :
        </p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>
      </section>

      {/* Distance */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">DISTANCE</h3>
        </div>

        <p>
          La distance correspond à la plus courte distance entre les deux
          aéroports, à laquelle on ajoute environ 7,6% pour les détours autour
          des aéroports.
        </p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      {/* CO2 */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">EMISSIONS CO₂</h3>
        </div>

        <p>
          Les émissions de CO₂ sont calculées à partir des coefficients de
          combustion et upstream, auxquels on ajoute une part fixe liée aux
          phases d’attente (holding). <br /> D'apres ATMOSFAIR, les emissions
          liees aux phases d'attentes sont estimees a 3.81kg de CO2 par
          passager.
        </p>

        <div className="equation-box">
          <div id="equation3" />
        </div>
      </section>

      {/* Non CO2 */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">
            EMISSIONS NON-CO₂ (TRAINEES)
          </h3>
        </div>

        <p>
          Les émissions non-CO₂ sont estimées à partir des émissions de
          combustion, auxquelles on applique un facteur 2.
        </p>

        <div className="equation-box">
          <div id="equation4" />
        </div>
      </section>

      {/* Total */}
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

export default PlaneSection;
