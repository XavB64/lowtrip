import { useEffect } from "react";

import i18n from "i18n";
import katex from "katex";

import { TripStep } from "types";

type SailSectionProps = {
  tripStep: TripStep;
};

const SailSection = ({ tripStep }: SailSectionProps) => {
  useEffect(() => {
    const emissionsPart = tripStep.emissionParts[0];

    // add equations
    const equations = [
      {
        equation: "CO₂eq_{traversee} = coeff_{traversee} \\times distance",
        center: true,
      },
      {
        equation: `distance = ${emissionsPart.distance}\\; km`,
        center: true,
      },
    ];

    equations.push({
      equation: `
          \\begin{aligned}
          CO₂eq_{traversee} &= coeff_{traversee} \\times distance \\\\
                        &= ${emissionsPart.coefficient} \\times ${emissionsPart.distance}\\; km \\\\ 
                        &= ${emissionsPart.emissions}\\; kgCO_2eq
          \\end{aligned}`,
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
          Les emissions calculees correspondent a l'empreinte d'un seul passager
          dans le voilier.
        </p>
        <p>
          Les émissions totales de CO₂eq du trajet sont obtenu en multipliant la
          distance parcourrue par un coefficient d'emission du voilier.
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
          La distance est calculée grace a l'algorithme de Djikstra (plus
          d'informations dans la methodologie complete).
        </p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      {/* Total */}
      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">EMISSIONS DE LA TRAVERSEE</h3>
        </div>

        <p>
          Le coefficient d'emissions utilise est fourni par l'entreprise
          SailCoop et ne prend en compte que la traversee (sans les emissions
          liees au reste du cycle de vie du bateau).
        </p>

        <div className="equation-box">
          <div id="equation3" className="blue-text" />
        </div>
      </section>
    </>
  );
};

export default SailSection;
