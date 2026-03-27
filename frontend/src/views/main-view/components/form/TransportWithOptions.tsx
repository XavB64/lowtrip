import { useState, useRef, useEffect } from "react";

import { TFunction } from "i18next";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import Tooltip from "common/components/Tooltip";
import { FerryOptions, thumbUp, Transport, type Step } from "types";

import "./TransportWithOptions.scss";

const getTransportOptions = (
  transport: Transport,
  t: TFunction,
): { label: string; stepOptions: Partial<Step> }[] => {
  if (![Transport.ecar, Transport.car, Transport.ferry].includes(transport)) {
    throw new Error(`Transport ${transport} does not have any option.`);
  }

  if (transport === Transport.ferry) {
    return [
      {
        label: t("form.ferryNone"),
        stepOptions: {
          options: FerryOptions.none,
          passengers: undefined,
        },
      },
      {
        label: t("form.ferryCabin"),
        stepOptions: {
          options: FerryOptions.cabin,
          passengers: undefined,
        },
      },
      {
        label: t("form.ferryVehicle"),
        stepOptions: {
          options: FerryOptions.vehicle,
          passengers: undefined,
        },
      },
      {
        label: t("form.ferryCabinVehicle"),
        stepOptions: {
          options: FerryOptions.cabinVehicle,
          passengers: undefined,
        },
      },
    ];
  }
  const basicCarOptions = [1, 2, 3, 4, 5, 6, 7].map((count) => ({
    label: t("form.passengersNb", { count }),
    stepOptions: {
      passengers: `${count}` as Step["passengers"],
      options: undefined,
    },
  }));
  return transport === Transport.car
    ? [
        ...basicCarOptions,
        {
          label: t("form.hitchHiking"),
          stepOptions: { passengers: thumbUp, options: undefined },
        },
      ]
    : basicCarOptions;
};

function getIcon(step: Step) {
  if (step.passengers) return step.passengers;
  if (step.options) {
    switch (step.options) {
      case FerryOptions.none:
        return "💺";
      case FerryOptions.cabin:
        return "🏠";
      case FerryOptions.vehicle:
        return "🚗";
      case FerryOptions.cabinVehicle:
        return "🏰";
    }
  }
  return "";
}

type Props = {
  updateStep: (index: number, data: Partial<Step>) => void;
  isSelected: boolean;
  step: Step;
  icon: React.ReactNode;
  transport: Transport;
};

export const TransportWithOptions = ({
  updateStep,
  isSelected,
  step,
  icon,
  transport,
}: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const options = getTransportOptions(transport, t);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const openMenu = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setOpen(true);
    setFocusedIndex(0);
  };

  const closeMenu = () => {
    setOpen(false);
    setFocusedIndex(-1);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case "Enter":
        if (focusedIndex >= 0) {
          const option = options[focusedIndex];
          updateStep(step.index, {
            transportMean: transport,
            ...option.stepOptions,
          });
          closeMenu();
        }
        break;
      case "Escape":
        closeMenu();
        break;
    }
  };

  return (
    <>
      <Tooltip content={transport} position="bottom">
        <button
          ref={buttonRef}
          className={`transport__button ${
            isSelected ? "transport__button--selected" : ""
          }`}
          onClick={() => (open ? closeMenu() : openMenu())}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <div className="transport__icon">{icon}</div>

          {isSelected && (
            <div className="transport__badge">{getIcon(step)}</div>
          )}
        </button>
      </Tooltip>

      {open &&
        createPortal(
          <ul
            ref={menuRef}
            className="transport__menu"
            style={{
              top: position.top,
              left: position.left,
              minWidth: position.width,
            }}
            role="menu"
            onKeyDown={handleKeyDown}
          >
            {options.map((option, index) => (
              <li
                key={option.label}
                className={`transport__menu-item ${
                  index === focusedIndex ? "transport__menu-item--active" : ""
                }`}
                role="menuitem"
                tabIndex={0}
                onMouseEnter={() => setFocusedIndex(index)}
                onClick={() => {
                  updateStep(step.index, {
                    transportMean: transport,
                    ...option.stepOptions,
                  });
                  closeMenu();
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
};

export default TransportWithOptions;
