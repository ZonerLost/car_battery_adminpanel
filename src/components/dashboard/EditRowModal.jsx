import React, { useEffect, useState } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import TextField from "../shared/TextField";

const EditRowModal = ({ isOpen, onClose, row, onSave }) => {
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    diagramStatus: "",
    markerStatus: "",
  });

  useEffect(() => {
    if (row) {
      setForm({
        make: row.make || "",
        model: row.model || "",
        year: row.year || "",
        diagramStatus: row.diagramStatus || "",
        markerStatus: row.markerStatus || "",
      });
    }
  }, [row]);

  const handleChange = (key) => (e) =>
    setForm((s) => ({ ...s, [key]: e.target.value }));

  const handleSave = () => {
    if (onSave) onSave({ ...row, ...form });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Entry" size="md">
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Make"
            value={form.make}
            onChange={handleChange("make")}
          />
          <TextField
            label="Model"
            value={form.model}
            onChange={handleChange("model")}
          />
          <TextField
            label="Year"
            value={form.year}
            onChange={handleChange("year")}
          />

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Diagram Status
            </label>
            <select
              value={form.diagramStatus}
              onChange={handleChange("diagramStatus")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="uploaded">Uploaded</option>
              <option value="missing">Missing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Marker Status
            </label>
            <select
              value={form.markerStatus}
              onChange={handleChange("markerStatus")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="success">Set</option>
              <option value="pending">Pending</option>
              <option value="not-assigned">Not Assigned</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button size="md" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditRowModal;
