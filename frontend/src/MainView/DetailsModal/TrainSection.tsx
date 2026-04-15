import { useEffect } from "react";

import i18n from "i18n";
import katex from "katex";

import { TripStep } from "types";

type TrainSectionProps = {
  tripStep: TripStep;
};

const TrainSection = ({ tripStep }: TrainSectionProps) => {
  // Render the LaTeX equation using KaTeX
  useEffect(() => {
    const emissionsParts = tripStep.emissionParts;

    // add equations
    const equations = [
      {
        equation:
          "CO_2eq = coeff_{infra} \\times distance_{totale} + \\sum_{pays} coeff_{pays} \\times distance_{pays}",
        center: true,
      },
    ];

    emissionsParts.forEach((emissionPart) => {
      if (emissionPart.emissionSource === "infra") {
        equations.push({
          equation: `
\\begin{aligned}
CO_2eq_{infra} &= coeff_{infra} \\times distance_{totale} \\\\
                  &= ${emissionPart.coefficient} \\times ${emissionPart.distance}\\; km \\\\
                  &= ${emissionPart.emissions}\\; kgCO_2eq
\\end{aligned}
`,
          center: true,
        });
        equations.push({
          equation: `CO_2eq_{pays} = coeff_{pays} \\times distance_{pays}`,
          center: true,
        });
      } else {
        const {
          emissionSource: country,
          coefficient,
          distance,
          emissions,
        } = emissionPart;
        equations.push({
          equation: `CO_2eq_{${country}} = ${coefficient} \\times ${distance}\\; km = ${emissions}\\; kgCO_2eq`,
          center: false,
        });
      }
    });

    equations.push({
      equation: `CO_2eq = CO_2eq_{infra} + \\sum_{pays} CO_2eq_{pays} = ${tripStep.emissions}\\; kgCO_2eq`,
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
          Les émissions totales de CO₂eq sont calculées en additionnant l’impact
          lié aux infrastructures sur l’ensemble de la distance parcourue et la
          somme des émissions spécifiques à chaque pays traversé:
        </p>

        <div className="equation-box">
          <div id="equation1" className="blue-text" />
        </div>

        <p>
          Les facteurs d'emissions proviennent de l'ADEME pour les pays europens
          et du Railway Handbook pour la Chine, le Japon, les US, l’Inde et la
          Russie. Pour les autres pays, valeurs par defaut de 100gCO2 /p.km.
          <br />
          Les distance sont calculees par la Railway Routing platform.
        </p>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">2</span>
          <h3 className="details-section-title">
            EMISSIONS LIEES A L'INFRASTRUCTURE
          </h3>
        </div>

        <p>
          Les émissions liées à l’infrastructure sont calculées en multipliant
          la distance totale du trajet par un coefficient représentant l’impact
          des infrastructures.
        </p>

        <div className="equation-box">
          <div id="equation2" />
        </div>
      </section>

      <section className="details-section">
        <div className="details-section-header">
          <span className="details-section-step">3</span>
          <h3 className="details-section-title">
            EMISSIONS LIEES A LA CONSOMMATION ELECTRIQUE PAR PAYS
          </h3>
        </div>

        <p>
          Les émissions dans chaque pays sont calculées en multipliant la
          distance parcourue dans ce pays par son facteur d’émission spécifique.
        </p>

        <div className="equation-box">
          <div id="equation3" />
        </div>

        <p>Applications numeriques:</p>

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

export default TrainSection;
