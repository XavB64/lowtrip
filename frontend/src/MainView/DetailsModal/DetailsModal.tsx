import { useEffect, useState } from "react";

import Modal from "components/Modal";
import { Transport, Trip } from "types";

import "./DetailsModal.scss";
import TrainSection from "./TrainSection";
import Button from "components/Button";
import PlaneSection from "./PlaneSection";
import CarSection, { AutoStopSection } from "./CarSection";
import ElectricCarSection from "./ElectricCarSection";
import BusSection from "./BusSection";
import BicycleSection from "./BicycleSection";
import FerrySection from "./FerrySection";
import SailSection from "./SailSection";

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
          if (step.transportMeans === Transport.train)
            return <TrainSection key={index} tripStep={step} />;
          if (step.transportMeans === Transport.plane)
            return <PlaneSection key={index} tripStep={step} />;
          if (step.transportMeans === Transport.car)
            return step.isAutoStop ? (
              <AutoStopSection key={index} tripStep={step} />
            ) : (
              <CarSection key={index} tripStep={step} />
            );
          if (step.transportMeans === Transport.ecar)
            return <ElectricCarSection key={index} tripStep={step} />;
          if (step.transportMeans === Transport.bus)
            return <BusSection key={index} tripStep={step} />;
          if (step.transportMeans === Transport.bicycle)
            return <BicycleSection key={index} tripStep={step} />;
          if (step.transportMeans === Transport.ferry)
            return <FerrySection key={index} tripStep={step} />;
          if (step.transportMeans === Transport.sail)
            return <SailSection key={index} tripStep={step} />;
        })}
      </div>
    </Modal>
  );
};

export default DetailsModal;
