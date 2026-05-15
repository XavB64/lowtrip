import { useEffect, useState } from "react";

import Button from "components/Button";
import Modal from "components/Modal";
import { Transport, Trip } from "types";

import AutoStopSection from "./AutoStopSection";
import BicycleSection from "./BicycleSection";
import BusSection from "./BusSection";
import CarSection from "./CarSection";
import ElectricCarSection from "./ElectricCarSection";
import FerrySection from "./FerrySection";
import PlaneSection from "./PlaneSection";
import SailSection from "./SailSection";
import TrainSection from "./TrainSection";
import "./DetailsModal.scss";

type DetailsModalProps = {
  onClose: () => void;
  isOpen: boolean;
  trips: Trip[];
};

const DetailsModal = ({ trips, onClose, isOpen }: DetailsModalProps) => {
  const [displayedTrip, setDisplayedTrip] = useState(trips[0]);

  useEffect(() => {
    setDisplayedTrip(trips[0]);
  }, [trips]);

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      headerTitle=""
      className="details-modal"
    >
      <nav className="tabs">
        {trips.map((trip) => (
          <Button
            key={trip.label}
            className={`tab ${trip.label === displayedTrip.label ? "active" : ""}`}
            onClick={() => setDisplayedTrip(trip)}
          >
            {trip.label}
          </Button>
        ))}
      </nav>

      <div className="tranport-sections">
        {displayedTrip.steps.map((step, index) => {
          if (step.transport === Transport.train)
            return <TrainSection key={index} tripStep={step} />;
          if (step.transport === Transport.plane)
            return <PlaneSection key={index} tripStep={step} />;
          if (step.transport === Transport.car)
            return step.is_hitch_hike ? (
              <AutoStopSection key={index} tripStep={step} />
            ) : (
              <CarSection key={index} tripStep={step} />
            );
          if (step.transport === Transport.ecar)
            return <ElectricCarSection key={index} tripStep={step} />;
          if (step.transport === Transport.bus)
            return <BusSection key={index} tripStep={step} />;
          if (step.transport === Transport.bicycle)
            return <BicycleSection key={index} tripStep={step} />;
          if (step.transport === Transport.ferry)
            return <FerrySection key={index} tripStep={step} />;
          if (step.transport === Transport.sail)
            return <SailSection key={index} tripStep={step} />;
        })}
      </div>
    </Modal>
  );
};

export default DetailsModal;
