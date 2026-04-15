import { useEffect } from "react";

import i18n from "i18n";
import katex from "katex";

import { TripStep } from "types";
import { round } from "utils";

const COEFF_CONSOMMATION = 0.187;

type ElectricCarSectionProps = {
  tripStep: TripStep;
};

const ElectricCarSection = ({ tripStep }: ElectricCarSectionProps) => {
  useEffect(() => {
    const emissionsParts = tripStep.emissionParts;

    // add equations
    const equations = [
      {
        equation:
          "CO₂eq = \\frac{CO₂eq_{construction} + \\sum_{pays} \\left(coeff_{pays} \\times distance_{pays}\\right)}{nb_{passengers}}",
        center: true,
      },
    ];

    emissionsParts.forEach((emissionPart) => {
      if (emissionPart.emissionSource === "construction") {
        equations.push({
          equation: `
          \\begin{aligned}
          CO₂eq_{construction} &= coeff_{construction} \\times distance_{totale} \\\\
                        &= ${emissionPart.coefficient} \\times ${emissionPart.distance}\\; km \\\\ 
                        &= ${round(emissionPart.coefficient * emissionPart.distance)}\\; kgCO_2eq
          \\end{aligned}`,
          center: true,
        });
        equations.push({
          equation: `CO_2eq_{country} = coeff_{conso} \\times \\left(1 + 0.04 \\times (nb_{passengers} - 1)\\right) \\times coeff_{country} \\times distance_{country}`,
          center: true,
        });
      } else {
        const { emissionSource: country, coefficient, distance } = emissionPart;
        equations.push({
          equation: `CO_2eq_{${country}} = ${COEFF_CONSOMMATION} \\times \\left(1 + 0.04 \\times (${tripStep.passengers} - 1)\\right) \\times ${round(coefficient, 3)} \\times ${distance}\\; km = ${round(coefficient * (1 + 0.04 * (tripStep.passengers! - 1)) * distance * COEFF_CONSOMMATION)}\\; kgCO_2eq`,
          center: false,
        });
      }
    });

    equations.push({
      equation: `CO₂eq = \\frac{CO₂eq_{construction} + CO₂eq_{essence}}{nb_{passengers}} = ${tripStep.emissions}\\; kgCO_2eq`,
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
          Nous calculons l'empreinte carbone de trajet pour un seul passager
          dans le vehicule.
        </p>
        <p>
          Les émissions totales de CO₂eq du trajet sont calculées en
          additionnant les émissions liées à la construction (véhicule et
          infrastructures) et les émissions liées à la production de
          l'electricite consommee. Les emission totales sont ensuite réparties
          entre les passagers.
        </p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">
            EMISSIONS LIEES A LA CONSTRUCTION
          </h3>
        </div>

        <p>
          Les émissions liées à la construction du vehicule et des
          infrastructures sont calculees a partir d'un coefficient fourni par
          l'ADEME et de la distance de l'itineraire.
        </p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            EMISSIONS LIEES A LA CONSOMMATION D'ELECTRICITE
          </h3>
        </div>

        <p>
          Etant donne que le coefficient utilise pour la consommation correspond
          au cas d'un trajet d'une personne seule dans un vehicule (fourni par
          l'ADEME), les émissions liées à la consommation d'electricite sont
          ajustées en fonction du nombre de passagers (poids supplémentaire).
        </p>
        <p>
          A noter que le coefficient d'emission de chaque pays depend de son mix
          energetique et donc de si son electricite est bas-carbone ou non.
        </p>

        <div className="equation-box">
          <div id="equation3" />
        </div>

        <p>Applications numeriques:</p>

        <div className="equation-box">
          {tripStep.emissionParts
            .filter(({ emissionSource }) => emissionSource !== "construction")
            .map((emissionPart, index) => (
              <div
                id={`equation${4 + index}`}
                key={emissionPart.emissionSource}
              />
            ))}
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">TOTAL</h3>
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

export default ElectricCarSection;
