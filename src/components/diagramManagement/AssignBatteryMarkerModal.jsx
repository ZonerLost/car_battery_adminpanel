import React, { useEffect, useRef, useState } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";

const DEFAULT_MARKER = { x: 50, y: 35 }; // center-ish

const AssignBatteryMarkerModal = ({ isOpen, diagram, onClose, onSave }) => {
  const containerRef = useRef(null);
  const [marker, setMarker] = useState(DEFAULT_MARKER);

  useEffect(() => {
    if (isOpen && diagram?.markerPosition) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMarker(diagram.markerPosition);
    } else if (isOpen) {
      setMarker(DEFAULT_MARKER);
    }
  }, [isOpen, diagram]);

  const handleClick = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMarker({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  const handleSave = () => {
    if (!diagram) return;
    onSave(diagram.id, marker);
  };

  if (!diagram) {
    return null;
  }

  const title = "Assign Battery Marker";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <div className="text-center text-xs font-semibold text-slate-800">
          {diagram.make} {diagram.model}
          <div className="text-[11px] text-slate-500">{diagram.year}</div>
        </div>

        <div
          ref={containerRef}
          className="relative mx-auto w-full max-w-xs aspect-3/5 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden cursor-crosshair"
          onClick={handleClick}
        >
          {/* Placeholder car silhouette – replace with real image if you have one */}
          <div className="absolute inset-6 border-2pborder-dashed border-slate-300 rounded-full" />

          {/* Marker */}
          <div
            className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-lg flex items-center justify-center text-[9px] text-white font-semibold"
            style={{
              left: `${marker.x}%`,
              top: `${marker.y}%`,
            }}
          >
            +
          </div>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          Click on the car diagram to place the battery marker. You can move it
          by clicking again.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-between">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Close
          </Button>
          <Button type="button" fullWidth onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AssignBatteryMarkerModal;
