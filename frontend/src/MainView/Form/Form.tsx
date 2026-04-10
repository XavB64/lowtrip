// Lowtrip, a web interface to compute travel CO2eq for different means of transport worldwide.

// Copyright (C) 2024  Bonnemaizon Xavier, Ni Clara, Gres Paola & Pellas Chiara

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { useMemo } from "react";

import { useTranslation } from "react-i18next";
import { BiSolidPlusCircle } from "react-icons/bi";

import Button from "components/Button";
import Modal from "components/Modal";
import { useSimulationContext } from "MainView/helpers/simulationContext";
import { TRIP_TYPE } from "types";

import { StepField } from "./StepField";
import { getAdviceTextTranslation } from "../helpers/translationHelper";
import { stepsAreInvalid } from "../helpers/utils";
import "./Form.scss";

type FormProps = {
  displayedTrip: TRIP_TYPE;
  showAlternativeForm?: () => void;
};

const Form = ({ displayedTrip, showAlternativeForm }: FormProps) => {
  const { t } = useTranslation();

  const {
    steps: mainSteps,
    alternativeSteps,
    errorMessage,
    isLoading,
    addStep,
    updateStep,
    removeStep,
    submitForm,
    closeErrorModal,
  } = useSimulationContext();

  const steps = useMemo(
    () =>
      displayedTrip === TRIP_TYPE.ALTERNATIVE ? alternativeSteps : mainSteps,
    [displayedTrip, alternativeSteps, mainSteps],
  );

  const formIsValid = useMemo(
    () =>
      !stepsAreInvalid(steps) &&
      // alternative form is valid only if the first form is also valid
      (displayedTrip == TRIP_TYPE.MAIN || !stepsAreInvalid(mainSteps)),
    [displayedTrip, steps, mainSteps],
  );

  const adviceText = useMemo(
    () =>
      displayedTrip === TRIP_TYPE.ALTERNATIVE && stepsAreInvalid(mainSteps)
        ? t("form.adviceText.previousFormIsInvalid")
        : getAdviceTextTranslation(t, steps),
    [t, displayedTrip, mainSteps, alternativeSteps],
  );

  return (
    <div
      className={`form ${displayedTrip === TRIP_TYPE.ALTERNATIVE ? "alternative-trip" : ""}`}
    >
      {steps.map((step) => (
        <StepField
          key={`main-form-${step.id}`}
          step={step}
          updateStep={(index, data) =>
            updateStep(displayedTrip, step.index, data)
          }
          removeStep={(index) => removeStep(displayedTrip, index)}
        />
      ))}

      <Button
        className="add-step-button"
        onClick={() => addStep(displayedTrip)}
      >
        <span className="icon-wrapper">
          <BiSolidPlusCircle />
        </span>
        {t("form.addStep")}
      </Button>

      <hr className="divider" aria-orientation="horizontal" />

      <div className="submit-section">
        <p>{adviceText}</p>

        <div className="buttons-row">
          <Button
            onClick={() =>
              submitForm(
                mainSteps,
                displayedTrip === TRIP_TYPE.ALTERNATIVE
                  ? alternativeSteps
                  : undefined,
              )
            }
            disabled={!formIsValid}
            loading={isLoading}
            className="form-action-button"
          >
            {displayedTrip === TRIP_TYPE.ALTERNATIVE
              ? t("form.compareWithThisTrip")
              : mainSteps.length < 3
                ? t("form.otherTransportMeans")
                : t("form.computeEmissions")}
          </Button>

          {displayedTrip !== TRIP_TYPE.ALTERNATIVE && showAlternativeForm && (
            <Button
              onClick={showAlternativeForm}
              disabled={!formIsValid}
              className="form-action-button"
              outline
            >
              {t("form.compareToAnotherTrip")}
            </Button>
          )}
        </div>
      </div>

      <Modal
        headerTitle={t("form.errorTitle")}
        onClose={closeErrorModal}
        isOpen={!!errorMessage}
      >
        <p>{errorMessage ?? t("form.errorNoPathFound")}</p>
      </Modal>
    </div>
  );
};

export default Form;
