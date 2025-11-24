import React, { useEffect, useState } from "react";
import Modal from "../shared/Modal";
import FormRow from "../shared/FormRow";
import TextField from "../shared/TextField";
import SelectField from "../shared/SelectField";
import TextAreaField from "../shared/TextAreaField";
import Button from "../shared/Button";

const EMPTY_VALUES = {
  make: "",
  model: "",
  year: "",
  bodyType: "",
  description: "",
  status: "active",
};

/**
 * Build safe form state from props.
 * This keeps all defaults in one place and avoids undefined checks everywhere.
 */
function buildFormValues(mode, initialValues) {
  if (mode === "edit" && initialValues) {
    return {
      make: initialValues.make ?? "",
      model: initialValues.model ?? "",
      year:
        initialValues.year !== undefined && initialValues.year !== null
          ? String(initialValues.year)
          : "",
      bodyType: initialValues.bodyType ?? "",
      description: initialValues.description ?? "",
      status: initialValues.status ?? "active",
    };
  }

  // add mode or no initialValues → clean form
  return { ...EMPTY_VALUES };
}

const CarEntryModal = ({ isOpen, mode = "add", initialValues, onClose, onSubmit }) => {
  const [values, setValues] = useState(() =>
    buildFormValues(mode, initialValues)
  );
  const [diagramFiles, setDiagramFiles] = useState([]);
  const [markerFiles, setMarkerFiles] = useState([]);

  // When modal opens OR mode/initialValues change, rebuild form state
  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(buildFormValues(mode, initialValues));

    // when switching to "add", reset uploads as well
    if (mode === "add") {
      setDiagramFiles([]);
      setMarkerFiles([]);
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

  const handleMarkerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMarkerFiles((prev) => [...prev, file]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // You can add real validation here later
    const payload = {
      ...(initialValues || {}),
      ...values,
      year: values.year ? Number(values.year) : undefined,
    };

    onSubmit(payload);
  };

  const title = mode === "edit" ? "Edit Car Entry" : "Add New Car Entry";
  const primaryLabel = mode === "edit" ? "Save Changes" : "Add Car";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Car make / model */}
        <FormRow className="md:grid-cols-2 gap-4">
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
        </FormRow>

        {/* Year / Body type */}
        <FormRow className="md:grid-cols-2 gap-4">
          <TextField
            label="Year"
            name="year"
            type="number"
            value={values.year}
            onChange={handleChange}
            placeholder="Enter year (e.g., 2015)"
          />
          <SelectField
            label="Body Type"
            name="bodyType"
            value={values.bodyType}
            onChange={handleChange}
            options={[
              { label: "Sedan", value: "Sedan" },
              { label: "SUV", value: "SUV" },
              { label: "Hatchback", value: "Hatchback" },
              { label: "Truck", value: "Truck" },
            ]}
            placeholder="Select body type (Sedan, SUV, Hatchback, etc.)"
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

        {/* Status */}
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

        {/* Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Diagrams */}
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

          {/* Battery marker */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <span className="text-[11px] font-medium text-slate-700">
                Assign Battery Marker
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              {markerFiles.map((file) => (
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
                  onChange={handleMarkerUpload}
                />
              </label>
            </div>
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

export default CarEntryModal;
