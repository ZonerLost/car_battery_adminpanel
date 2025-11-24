import React, { useEffect, useState } from "react";
import Modal from "../shared/Modal";
import FormRow from "../shared/FormRow";
import TextField from "../shared/TextField";
import TextAreaField from "../shared/TextAreaField";
import SelectField from "../shared/SelectField";
import Button from "../shared/Button";

const EMPTY_VALUES = {
  make: "",
  model: "",
  year: "",
  description: "",
  status: "active",
};

function buildFormValues(mode, initialValues) {
  if (mode === "edit" && initialValues) {
    return {
      make: initialValues.make ?? "",
      model: initialValues.model ?? "",
      year:
        initialValues.year !== undefined && initialValues.year !== null
          ? String(initialValues.year)
          : "",
      description: initialValues.description ?? "",
      status: initialValues.status ?? "active",
    };
  }
  return { ...EMPTY_VALUES };
}

const DiagramEntryModal = ({
  isOpen,
  mode = "add",
  initialValues,
  onClose,
  onSubmit,
}) => {
  const [values, setValues] = useState(() =>
    buildFormValues(mode, initialValues)
  );
  const [diagramFiles, setDiagramFiles] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(buildFormValues(mode, initialValues));
    if (mode === "add") {
      setDiagramFiles([]);
    }
  }, [isOpen, mode, initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleDiagramUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDiagramFiles((prev) => [...prev, file]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...(initialValues || {}),
      ...values,
      year: values.year ? Number(values.year) : undefined,
      // you could attach diagramFiles here when you wire to API
    };

    onSubmit(payload);
  };

  const title =
    mode === "edit" ? "Edit Diagram" : "Add New Diagram";
  const primaryLabel =
    mode === "edit" ? "Save Changes" : "Add Diagram";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Make / model / year */}
        <FormRow className="md:grid-cols-3 gap-4">
          <TextField
            label="Car Make"
            name="make"
            value={values.make}
            onChange={handleChange}
            placeholder="Enter car brand (e.g., Toyota)"
          />
          <TextField
            label="Car Model"
            name="model"
            value={values.model}
            onChange={handleChange}
            placeholder="Enter model name (e.g., Corolla)"
          />
          <TextField
            label="Year"
            name="year"
            type="number"
            value={values.year}
            onChange={handleChange}
            placeholder="Enter year (e.g., 2015)"
          />
        </FormRow>

        {/* Description */}
        <TextAreaField
          label="Battery Location Description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="Describe where the battery is located (e.g., Engine bay – right side near fuse box)"
          rows={4}
        />

        {/* Status – only shown in edit (matches your Figma) */}
        {mode === "edit" && (
          <SelectField
            label="Status"
            name="status"
            value={values.status}
            onChange={handleChange}
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
            placeholder="Select status (Active / Inactive)"
          />
        )}

        {/* Upload diagram */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[11px] font-medium text-slate-700">
              Upload Diagram (png/jpeg/svg/webp)
            </span>
            <span className="text-red-500 text-[11px]">*</span>
          </div>

          <div className="flex flex-wrap gap-3">
            {diagramFiles.map((file) => (
              <div
                key={file.name}
                className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[10px] flex flex-col gap-1"
              >
                <span className="truncate">{file.name}</span>
              </div>
            ))}

            <label className="w-12 h-12 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white cursor-pointer text-xl text-slate-400">
              +
              <input
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.svg,.webp,.pdf"
                onChange={handleDiagramUpload}
              />
            </label>
          </div>
        </div>

        {/* Assign battery marker placeholder */}
        <div>
          <span className="text-[11px] font-medium text-slate-700">
            Assign Battery Marker
          </span>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-28 h-20 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400">
              Marker preview
            </div>
            <span className="text-[11px] text-slate-500">
              Use the "Assign Marker" action in the table to place the marker.
            </span>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            {mode === "edit" ? "Close" : "Cancel"}
          </Button>
          <Button type="submit" fullWidth>
            {primaryLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DiagramEntryModal;
