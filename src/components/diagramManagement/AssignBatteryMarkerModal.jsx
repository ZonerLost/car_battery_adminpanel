/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import { VehicleBatteryDiagramPicker } from "../diagram/VehicleBatteryDiagram";
import { normalizeMarker } from "../../utils/batteryMarkerResolver";

const DEFAULT_MARKER = { xPct: 50, yPct: 35 };

const AssignBatteryMarkerModal = ({ isOpen, diagram, onClose, onSave }) => {
  const [markerValue, setMarkerValue] = useState(DEFAULT_MARKER);

  useEffect(() => {
    if (!isOpen) return;
    setMarkerValue(normalizeMarker(diagram?.marker) || DEFAULT_MARKER);
  }, [isOpen, diagram]);

  const yearLabel = useMemo(() => {
    if (!diagram) return "--";
    if (diagram.yearFrom && diagram.yearTo) return `${diagram.yearFrom}-${diagram.yearTo}`;
    return diagram.yearFrom || "--";
  }, [diagram]);

  const handleSave = () => {
    if (!diagram?.id) return;
    onSave?.(diagram.id, markerValue);
  };

  if (!diagram) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Battery Marker" size="md">
      <div className="space-y-4">
        <div className="text-center text-xs font-semibold text-slate-800">
          {diagram.make} {diagram.model}
          <div className="text-[11px] text-slate-500">{yearLabel}</div>
        </div>

        <div className="mx-auto w-full max-w-xs rounded-lg border border-slate-300 bg-slate-100 p-4">
          <VehicleBatteryDiagramPicker
            templateId={diagram.templateId}
            diagramUrl={diagram.diagramUrl}
            value={markerValue}
            onChange={setMarkerValue}
            className="mx-auto w-full"
          />
        </div>

        <p className="text-center text-[11px] text-slate-500">
          Click or drag on the diagram to place the battery marker. It saves as % of the image area
          so it stays correct on all screen sizes.
          <br />
          <span className="text-slate-700">
            x: <b>{markerValue.xPct.toFixed(2)}%</b>, y: <b>{markerValue.yPct.toFixed(2)}%</b>
          </span>
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
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
