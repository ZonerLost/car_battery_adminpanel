/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import TextField from "../shared/TextField";

const DIAGRAM_OPTIONS = [
  { label: "Select", value: "" },
  { label: "Uploaded", value: "uploaded" },
  { label: "Missing", value: "missing" },
];

const EditRowModal = ({ isOpen, onClose, row, onSave }) => {
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    diagramStatus: "",
  });

  const canSave = useMemo(() => {
    const yearOk = form.year === "" || /^\d{4}$/.test(String(form.year));
    return Boolean(form.make?.trim()) && Boolean(form.model?.trim()) && yearOk;
  }, [form.make, form.model, form.year]);

  useEffect(() => {
    if (!row) return;

    setForm({
      make: row.make ?? "",
      model: row.model ?? "",
      year: row.year ?? "",
      diagramStatus: row.diagramStatus ?? "",
    });
  }, [row]);

  const handleChange = (key) => (e) => {
    setForm((s) => ({ ...s, [key]: e.target.value }));
  };

  const handleSave = () => {
    if (!row) return;
    if (!canSave) return;

    const next = {
      ...row,
      ...form,
      year: form.year === "" ? "" : Number(form.year),
    };

    onSave?.(next);
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Entry" size="md">
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Make" value={form.make} onChange={handleChange("make")} />
          <TextField label="Model" value={form.model} onChange={handleChange("model")} />
          <TextField label="Year" value={form.year} onChange={handleChange("year")} />

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Diagram Status</label>
            <select
              value={form.diagramStatus}
              onChange={handleChange("diagramStatus")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E53935]"
            >
              {DIAGRAM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button size="md" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="md"
            variant="primary"
            onClick={handleSave}
            className={!canSave ? "opacity-60 pointer-events-none" : ""}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditRowModal;
