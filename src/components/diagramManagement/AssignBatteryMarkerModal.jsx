/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";

const DEFAULT_MARKER = { xPct: 50, yPct: 35 };

const AssignBatteryMarkerModal = ({ isOpen, diagram, onClose, onSave }) => {
  const containerRef = useRef(null);
  const [marker, setMarker] = useState(DEFAULT_MARKER);

  useEffect(() => {
    if (!isOpen) return;

    if (diagram?.marker?.xPct != null && diagram?.marker?.yPct != null) {
      setMarker({ xPct: diagram.marker.xPct, yPct: diagram.marker.yPct });
    } else {
      setMarker(DEFAULT_MARKER);
    }
  }, [isOpen, diagram]);

  const handleClick = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    setMarker({
      xPct: Math.min(100, Math.max(0, xPct)),
      yPct: Math.min(100, Math.max(0, yPct)),
    });
  };

  const handleSave = () => {
    if (!diagram?.id) return;
    onSave(diagram.id, marker);
  };

  if (!diagram) return null;

  const yearLabel =
    diagram.yearFrom && diagram.yearTo
      ? `${diagram.yearFrom}-${diagram.yearTo}`
      : diagram.yearFrom || "--";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Battery Marker" size="md">
      <div className="space-y-4">
        <div className="text-center text-xs font-semibold text-slate-800">
          {diagram.make} {diagram.model}
          <div className="text-[11px] text-slate-500">{yearLabel}</div>
        </div>

        <div
          ref={containerRef}
          className="relative mx-auto w-full max-w-xs aspect-3/5 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden cursor-crosshair"
          onClick={handleClick}
        >
          {diagram.diagramUrl ? (
            <img
              src={diagram.diagramUrl}
              alt="Diagram"
              className="absolute inset-0 h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-500">
              No diagram uploaded
            </div>
          )}

          <div
            className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-lg flex items-center justify-center text-[9px] text-white font-semibold"
            style={{ left: `${marker.xPct}%`, top: `${marker.yPct}%` }}
          >
            +
          </div>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          Click on the diagram to place the marker. It saves as a percentage so it stays correct on all screen sizes.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-between">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Close
          </Button>
          <Button type="button" fullWidth onClick={handleSave} disabled={!diagram.diagramUrl}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AssignBatteryMarkerModal;
