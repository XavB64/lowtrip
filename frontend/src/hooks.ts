import { useCallback, useEffect, useState } from "react";
import { Step } from "./types";
import nextId from "react-id-generator";

export const useSteps = () => {
  const [steps, setSteps] = useState<Step[]>([
    { index: 1, id: nextId() },
    { index: 2, id: nextId() },
  ]);

  const addStep = useCallback(
    () => setSteps([...steps, { index: steps.length + 1, id: nextId() }]),
    [steps, setSteps],
  );

  const removeStep = useCallback(
    (index: number) => {
      setSteps(steps.filter((step) => step.index !== index));
    },
    [steps, setSteps],
  );

  const updateStep = useCallback(
    (index: number, data: Partial<Step>) => {
      setSteps(
        steps.map((step) =>
          step.index === index ? { ...step, ...data } : step,
        ),
      );
    },
    [steps, setSteps],
  );

  return { values: steps, addStep, removeStep, updateStep };
};

export const useDebounce = <T = string | number>(
  value: T,
  delay: number,
): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};
