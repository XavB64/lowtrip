import { useEffect } from "react";

import i18n from "i18n";
import katex from "katex";

import { TripStep } from "types";
import { round } from "utils";

type CarSectionProps = {
  tripStep: TripStep;
};

const CarSection = ({ tripStep }: CarSectionProps) => {
  useEffect(() => {
    const emissionsParts = tripStep.emissionParts;

    // add equations
    const equations = [
      {
        equation:
          "CO₂eq = \\frac{CO₂eq_{construction} + CO₂eq_{essence}}{nb_{passengers}}",
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
                        &= ${round(emissionPart.coefficient * emissionPart.distance)}\\; kgCO_2eq
          \\end{aligned}`,
          center: true,
        });
      } else {
        equations.push({
          equation: `
          \\begin{aligned}
          CO₂eq_{essence} &= coeff_{essence} \\times \\left(1 + 0.04 \\times (nb_{passengers} - 1)\\right) \\times distance \\\\
                    &=${emissionPart.coefficient} \\times (1 + 0.04 \\times (${tripStep.passengers} - 1)) \\times ${emissionPart.distance}\\; km \\\\
                    &= ${round(emissionPart.coefficient * emissionPart.distance * (1 + 0.04 * (tripStep.passengers! - 1)))}\\; kgCO_2eq
          \\end{aligned}`,
          center: true,
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
    <div className="space-y-4 text-sm">
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">1</span>
          <h3 className="details-section-title">ÉQUATION GÉNÉRALE</h3>
        </div>

        <p>
          Nous calculons l'empreinte carbone de trajet pour un seul passager
          dans la voiture.
        </p>
        <p>
          Les émissions totales de CO₂eq du trajet en voiture sont calculées en
          additionnant les émissions liées à la construction (véhicule et
          infrastructures) et les émissions liées à la consommation de
          carburant, puis elles sont réparties entre les passagers.
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
          Les émissions liées à la construction (vehicule et infrastructures)
          sont calculées en multipliant la distance par un coefficient issu de
          l’ADEME.
        </p>

        <div className="equation-box">
          <div id="equation3" />
        </div>
      </section>

      {/* Essence */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">
            EMISSIONS LIEES A LA CONSOMMATION D'ESSENCE
          </h3>
        </div>

        <p>
          Etant donne que le coefficient utilise correspond aux emissions d'un
          trajet d'une personne seule dans un vehicule (fourni par l'ADEME), les
          émissions liées à la consommation d’essence sont ajustées en fonction
          du nombre de passagers (poids supplémentaire).
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
    </div>
  );
};

type AutoStopSectionProps = {
  tripStep: TripStep;
};

export const AutoStopSection = ({ tripStep }: AutoStopSectionProps) => {
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
          equation: "CO₂eq_{construction} = 0\\; kgCO_2eq",
          center: true,
        });
      } else {
        equations.push({
          equation: `
          \\begin{aligned}
          CO₂eq_{essence} &= coeff_{essence} \\times0.04 \\times distance \\\\
                    &=${emissionPart.coefficient} \\times 0.04 \\times ${emissionPart.distance}\\; km \\\\
                    &= ${round(emissionPart.coefficient * emissionPart.distance * 0.04)}\\; kgCO_2eq
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
    <div className="space-y-4 text-sm">
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">1</span>
          <h3 className="details-section-title">ÉQUATION GÉNÉRALE</h3>
        </div>

        <p>
          Nous calculons l'empreinte carbone de trajet pour un seul passager
          dans la voiture.
        </p>
        <p>
          Les émissions totales de CO₂eq du trajet en voiture sont calculées en
          additionnant les émissions liées à la construction (véhicule et
          infrastructures) et les émissions liées à la consommation de
          carburant, puis elles sont réparties entre les passagers.
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
          La distance est calculée à partir d’itinéraires issus d’OpenStreetMap
          Routing, basés sur les données OSM.
        </p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      {/* Construction */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            EMISSIONS LIEES A LA CONSTRUCTION
          </h3>
        </div>

        <p>
          Les émissions liées à la construction du vehicule et des
          infrastructures sont considerees comme nulle dans le cas d'un trajet
          en stop, car le trajet aurait eu lieu dans tous les cas.
        </p>

        <div className="equation-box">
          <div id="equation3" />
        </div>
      </section>

      {/* Essence */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">4</span>
          <h3 className="details-section-title">
            EMISSIONS LIEES A LA CONSOMMATION D'ESSENCE
          </h3>
        </div>

        <p>
          Dans le cas d'un trajet en stop, on ne considere que les emissions
          ajoutees au trajet par l'auto-stoppeur, soit uniquement 4% des
          emissions standards.
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
    </div>
  );
};

export default CarSection;
