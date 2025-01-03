import axios from "axios";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import nextId from "react-id-generator";
import {
  ApiResponse,
  SimulationResults,
  Step,
  TRIP_TYPE,
} from "../../../types";
import { useDisclosure } from "@chakra-ui/react";
import { API_URL } from "../../../config";
import { getPayload } from "./getPayload";
import { formatResponse } from "./formatResponse";

type Context = {
  steps: Step[];
  alternativeSteps: Step[];
  simulationResults?: SimulationResults;
  errorMessage: string;
  isLoading: boolean;
  modalContext: { isOpen: boolean; onClose: () => void };
  addStep: (trip: TRIP_TYPE) => void;
  removeStep: (trip: TRIP_TYPE, index: number) => void;
  updateStep: (trip: TRIP_TYPE, index: number, data: Partial<Step>) => void;
  setSteps: (steps: Step[]) => void;
  setAlternativeSteps: (steps: Step[]) => void;
  submitForm: (mainSteps: Step[], alternativeSteps?: Step[]) => void;
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

  const { isOpen, onOpen: openErrorModal, onClose } = useDisclosure();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addStep = useCallback(
    (trip: TRIP_TYPE) => {
      if (trip === TRIP_TYPE.MAIN) {
        setSteps([...steps, { index: steps.length + 1, id: nextId() }]);
      } else {
        setAlternativeSteps([
          ...alternativeSteps,
          { index: alternativeSteps.length + 1, id: nextId() },
        ]);
      }
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

  const submitForm = async (mainSteps: Step[], altSteps?: Step[]) => {
    if (mainSteps.length < 1 || mainSteps.some((step) => !step.locationCoords))
      throw new Error("At least one step required");
    setIsLoading(true);

    const payload = getPayload(mainSteps, altSteps);

    axios
      .post(API_URL, JSON.stringify(payload), {
        headers: {
          "Access-Contol-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      })
      .then((response: ApiResponse) => {
        if (response.data.error) {
          setErrorMessage(response.data.error);
          openErrorModal();
        } else {
          const formattedSimulation = formatResponse(response.data);
          setSimulationResults({
            ...formattedSimulation,
            inputs: { mainTrip: mainSteps, alternativeTrip: altSteps },
          });
        }
      })
      .catch((err) => {
        console.log(err);
        openErrorModal();
      })
      .finally(async () => {
        setIsLoading(false);
      });
  };

  const context = useMemo(
    () => ({
      steps,
      alternativeSteps,
      simulationResults,
      errorMessage,
      isLoading,
      modalContext: {
        isOpen,
        onClose: () => {
          onClose();
          setErrorMessage("");
        },
      },
      addStep,
      removeStep,
      updateStep,
      setSteps,
      setAlternativeSteps,
      submitForm,
    }),
    [
      steps,
      alternativeSteps,
      simulationResults,
      errorMessage,
      isLoading,
      isOpen,
      onClose,
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
