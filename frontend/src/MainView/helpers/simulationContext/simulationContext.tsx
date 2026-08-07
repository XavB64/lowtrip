import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import nextId from "react-id-generator";

import { API_URL } from "config";
import {
  ApiError,
  ApiResponse,
  SimulationResults,
  Step,
  TRIP_TYPE,
} from "types";

import { formatResponse } from "./formatResponse";
import { formatStepsForApi } from "../utils";

type Context = {
  steps: Step[];
  alternativeSteps: Step[];
  simulationResults?: SimulationResults;
  error?: ApiError;
  isLoading: boolean;
  addStep: (trip: TRIP_TYPE) => void;
  removeStep: (trip: TRIP_TYPE, index: number) => void;
  updateStep: (trip: TRIP_TYPE, index: number, data: Partial<Step>) => void;
  setSteps: (steps: Step[]) => void;
  setAlternativeSteps: (steps: Step[]) => void;
  submitForm: (mainSteps: Step[], alternativeSteps?: Step[]) => void;
  cleanError: () => void;
};

const SimulationContext = createContext<Context | null>(null);

export const SimulationProvider = ({ children }: { children: ReactNode }) => {
  const [steps, setSteps] = useState<Step[]>([
    { index: 1, id: nextId() },
    { index: 2, id: nextId() },
  ]);
  const [alternativeSteps, setAlternativeSteps] = useState<Step[]>([
    { index: 1, id: nextId() },
    { index: 2, id: nextId() },
  ]);

  const [simulationResults, setSimulationResults] =
    useState<SimulationResults>();

  const [error, setError] = useState<ApiError>();
  const [isLoading, setIsLoading] = useState(false);

  const addStep = useCallback(
    (trip: TRIP_TYPE) => {
      let newSteps: Step[];

      if (trip === TRIP_TYPE.MAIN) {
        newSteps = [...steps, { index: steps.length + 1, id: nextId() }];
        setSteps(newSteps);
      } else {
        newSteps = [
          ...alternativeSteps,
          { index: alternativeSteps.length + 1, id: nextId() },
        ];
        setAlternativeSteps(newSteps);
      }

      requestAnimationFrame(() => {
        document.getElementById(`dropdownId-${newSteps.length}`)?.focus();
      });
    },
    [steps, alternativeSteps, setSteps, setAlternativeSteps],
  );

  const removeStep = useCallback(
    (trip: TRIP_TYPE, index: number) => {
      if (trip === TRIP_TYPE.MAIN) {
        setSteps(steps.filter((step) => step.index !== index));
      } else {
        setAlternativeSteps(
          alternativeSteps.filter((step) => step.index !== index),
        );
      }
    },
    [steps, alternativeSteps, setSteps, setAlternativeSteps],
  );

  const updateStep = useCallback(
    (trip: TRIP_TYPE, index: number, data: Partial<Step>) => {
      if (trip === TRIP_TYPE.MAIN) {
        setSteps(
          steps.map((step) =>
            step.index === index ? { ...step, ...data } : step,
          ),
        );
      } else {
        setAlternativeSteps(
          alternativeSteps.map((step) =>
            step.index === index ? { ...step, ...data } : step,
          ),
        );
      }
    },
    [steps, alternativeSteps, setSteps, setAlternativeSteps],
  );

  const submitForm = useCallback(
    async (mainSteps: Step[], altSteps?: Step[]) => {
      if (
        mainSteps.length < 1 ||
        mainSteps.some((step) => !step.locationCoords)
      )
        throw new Error("At least one step required");
      setIsLoading(true);

      const payload = {
        "main-trip": formatStepsForApi(mainSteps),
        "second-trip": formatStepsForApi(altSteps),
      };

      const res = await fetch(`${API_URL}/compute-emissions`, {
        method: "POST",
        headers: {
          "Access-Contol-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        try {
          const error: ApiError = await res.json();
          setError(error);
        } catch {
          console.error(`${res.status} ${res.statusText}`);
          setError({ code: "UNKNOWN_ERROR" });
        }
      } else {
        const response: ApiResponse = await res.json();
        const formattedSimulation = formatResponse(
          { mainSteps, altSteps },
          response,
        );
        setSimulationResults({
          ...formattedSimulation,
          inputs: { mainTrip: mainSteps, alternativeTrip: altSteps },
        });
      }

      setIsLoading(false);
    },
    [],
  );

  const context = useMemo(
    () => ({
      steps,
      alternativeSteps,
      simulationResults,
      error,
      isLoading,
      addStep,
      removeStep,
      updateStep,
      setSteps,
      setAlternativeSteps,
      submitForm,
      cleanError: () => {
        setError(undefined);
      },
    }),
    [
      steps,
      alternativeSteps,
      simulationResults,
      error,
      isLoading,
      addStep,
      removeStep,
      updateStep,
      setSteps,
      setAlternativeSteps,
      submitForm,
    ],
  );

  return (
    <SimulationContext.Provider value={context}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulationContext = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error(
      "useSimulation must be used within a SimulationProvider.Provider",
    );
  }
  return context;
};
