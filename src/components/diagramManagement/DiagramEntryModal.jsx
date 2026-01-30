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
  yearFrom: "",
  yearTo: "",
  bodyType: "",
  location: "",
  description: "",
  status: "active",
};

function buildFormValues(mode, initialValues) {
  if (mode === "edit" && initialValues) {
    return {
      make: initialValues.make ?? "",
      model: initialValues.model ?? "",
      yearFrom: initialValues.yearFrom != null ? String(initialValues.yearFrom) : "",
      yearTo: initialValues.yearTo != null ? String(initialValues.yearTo) : "",
      bodyType: initialValues.bodyType ?? "",
      location: initialValues.location ?? "",
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
  const [values, setValues] = useState(() => buildFormValues(mode, initialValues));
  const [diagramFile, setDiagramFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setValues(buildFormValues(mode, initialValues));
    setDiagramFile(null);
    setThumbnailFile(null);
    setErrors({});
  }, [isOpen, mode, initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!diagramFile && !initialValues?.diagramUrl) {
      setErrors((prev) => ({ ...prev, diagram: "Battery diagram is required." }));
      return;
    }

    const payload = {
      ...(initialValues || {}),
      ...values,
      yearFrom: values.yearFrom ? Number(values.yearFrom) : undefined,
      yearTo: values.yearTo ? Number(values.yearTo) : undefined,
    };

    onSubmit(payload, { diagramFile, thumbnailFile });
  };

  const title = mode === "edit" ? "Edit Diagram" : "Add New Diagram";
  const primaryLabel = mode === "edit" ? "Save Changes" : "Add Diagram";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <FormRow className="md:grid-cols-2 gap-4">
          <TextField
            label="Year From"
            name="yearFrom"
            type="number"
            value={values.yearFrom}
            onChange={handleChange}
            placeholder="e.g., 2015"
          />
          <TextField
            label="Year To"
            name="yearTo"
            type="number"
            value={values.yearTo}
            onChange={handleChange}
            placeholder="e.g., 2017 (optional)"
          />
        </FormRow>

        <FormRow className="md:grid-cols-2 gap-4">
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
              { label: "Other", value: "Other" },
            ]}
            placeholder="Select body type"
          />
          <SelectField
            label="Status"
            name="status"
            value={values.status}
            onChange={handleChange}
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
            placeholder="Select status"
          />
        </FormRow>

        <TextField
          label="Car Location"
          name="location"
          value={values.location}
          onChange={handleChange}
          placeholder="e.g., Pakistan"
        />

        <TextAreaField
          label="Battery Location Description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="Engine bay - right side near fuse box"
          rows={4}
        />

        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[11px] font-medium text-slate-700">
              Upload Diagram (battery location)
            </span>
            <span className="text-red-500 text-[11px]">*</span>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {diagramFile ? (
              <div className="w-56 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[10px]">
                <div className="truncate">{diagramFile.name}</div>
                <div className="text-[10px] text-slate-400">
                  {(diagramFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ) : null}

            <label className="w-12 h-12 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white cursor-pointer text-xl text-slate-400">
              +
              <input
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.svg,.webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setDiagramFile(file);
                  if (file) setErrors((prev) => ({ ...prev, diagram: "" }));
                }}
              />
            </label>

            {mode === "edit" && initialValues?.diagramUrl ? (
              <span className="text-[11px] text-slate-500">
                Existing diagram uploaded. Uploading again will replace it.
              </span>
            ) : null}

            {errors.diagram ? (
              <span className="text-[11px] text-red-600">{errors.diagram}</span>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[11px] font-medium text-slate-700">
              Upload Car Image (thumbnail)
            </span>
            <span className="text-[11px] text-slate-400">(optional)</span>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {thumbnailFile ? (
              <div className="w-56 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[10px]">
                <div className="truncate">{thumbnailFile.name}</div>
                <div className="text-[10px] text-slate-400">
                  {(thumbnailFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ) : null}

            <label className="w-12 h-12 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white cursor-pointer text-xl text-slate-400">
              +
              <input
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </label>

            {mode === "edit" && initialValues?.thumbnailUrl ? (
              <span className="text-[11px] text-slate-500">
                Existing thumbnail uploaded. Uploading again will replace it.
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium text-slate-700">Assign Battery Marker</span>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-28 h-20 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400">
              Marker preview
            </div>
            <span className="text-[11px] text-slate-500">
              Use the "Assign Marker" action in the table to place the marker.
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
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
