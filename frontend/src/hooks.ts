import { useCallback, useState } from "react";
import { Step } from "./types";

export function useSteps() {
  const [steps, setSteps] = useState<Step[]>([{ index: 1 }, { index: 2 }]);

  const addStep = useCallback(
    () => setSteps([...steps, { index: steps.length + 1 }]),
    [steps, setSteps]
  );

  const removeStep = useCallback(
    (index: number) => {
      setSteps(steps.filter((step) => step.index !== index));
    },
    [steps, setSteps]
  );

  const updateStep = useCallback(
    (index: number, data: Partial<Step>) => {
      setSteps(
        steps.map((step) =>
          step.index === index ? { ...step, ...data } : step
        )
      );
    },
    [steps, setSteps]
  );

  return { values: steps, addStep, removeStep, updateStep };
}
