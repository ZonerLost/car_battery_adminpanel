/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../shared/Modal";
import FormRow from "../shared/FormRow";
import TextField from "../shared/TextField";
import SelectField from "../shared/SelectField";
import TextAreaField from "../shared/TextAreaField";
import Button from "../shared/Button";
import { getTemplate, inferTemplateId } from "../../config/vehicleTemplates";

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

const CarEntryModal = ({ isOpen, mode = "add", initialValues, onClose, onSubmit }) => {
  const [values, setValues] = useState(() => buildFormValues(mode, initialValues));

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [diagramFile, setDiagramFile] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setValues(buildFormValues(mode, initialValues));
    setThumbnailFile(null);
    setDiagramFile(null);
  }, [isOpen, mode, initialValues]);

  const templatePreview = useMemo(() => {
    const tplId = inferTemplateId(values.bodyType);
    const tpl = getTemplate(tplId);
    return tpl?.src || null;
  }, [values.bodyType]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const effectiveDiagramPreview = useMemo(() => {
    // If there is an uploaded diagram already, it will be used.
    if (initialValues?.diagramUrl) return initialValues.diagramUrl;
    // Otherwise template is default
    return templatePreview;
  }, [initialValues?.diagramUrl, templatePreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...(initialValues || {}),
      ...values,
      yearFrom: values.yearFrom ? Number(values.yearFrom) : undefined,
      yearTo: values.yearTo ? Number(values.yearTo) : undefined,
      templateId: inferTemplateId(values.bodyType),
    };

    onSubmit(payload, { thumbnailFile, diagramFile });
  };

  const title = mode === "edit" ? "Edit Car Entry" : "Add New Car Entry";
  const primaryLabel = mode === "edit" ? "Save Changes" : "Add Car";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" className="hide-scrollbar">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow className="md:grid-cols-2 gap-4">
          <TextField label="Car Make" name="make" value={values.make} onChange={handleChange} placeholder="e.g., Toyota" />
          <TextField label="Car Model" name="model" value={values.model} onChange={handleChange} placeholder="e.g., Corolla" />
        </FormRow>

        <FormRow className="md:grid-cols-2 gap-4">
          <TextField label="Year From" name="yearFrom" type="number" value={values.yearFrom} onChange={handleChange} placeholder="e.g., 2015" />
          <TextField label="Year To" name="yearTo" type="number" value={values.yearTo} onChange={handleChange} placeholder="e.g., 2020 (optional)" />
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

        <TextField label="Car Location" name="location" value={values.location} onChange={handleChange} placeholder="e.g., Pakistan" />

        <TextAreaField
          label="Battery Location Description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="Engine bay - right side near fuse box"
          rows={4}
        />

        {/* Thumbnail upload */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[11px] font-medium text-slate-700">Upload Car Image (thumbnail)</span>
            <span className="text-[11px] text-slate-400">(optional)</span>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {thumbnailFile ? (
              <div className="w-56 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[10px]">
                <div className="truncate">{thumbnailFile.name}</div>
                <div className="text-[10px] text-slate-400">{(thumbnailFile.size / 1024).toFixed(1)} KB</div>
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
              <span className="text-[11px] text-slate-500">Existing thumbnail uploaded. Uploading again will replace it.</span>
            ) : null}
          </div>
        </div>

        {/* Diagram preview + optional upload override */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-700">Battery Diagram</span>
              <span className="text-[11px] text-slate-500">
                {initialValues?.diagramUrl ? "(Using uploaded diagram)" : "(Using template by body type)"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            {effectiveDiagramPreview ? (
              <div className="flex gap-3 items-start">
                <div className="relative w-28 h-44 rounded-lg bg-white border border-slate-200 overflow-hidden">
                  <img
                    src={effectiveDiagramPreview}
                    alt="Diagram preview"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable={false}
                  />
                </div>

                <div className="flex-1">
                  <div className="text-[11px] text-slate-600">
                    Upload a custom diagram only if template is not correct (optional).
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 items-center">
                    {diagramFile ? (
                      <div className="w-56 rounded-lg border border-slate-200 bg-white px-2 py-2 text-[10px]">
                        <div className="truncate">{diagramFile.name}</div>
                        <div className="text-[10px] text-slate-400">{(diagramFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                    ) : null}

                    <label className="w-12 h-12 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white cursor-pointer text-xl text-slate-400">
                      +
                      <input
                        type="file"
                        className="hidden"
                        accept=".png,.jpg,.jpeg,.svg,.webp"
                        onChange={(e) => setDiagramFile(e.target.files?.[0] || null)}
                      />
                    </label>

                    {mode === "edit" && initialValues?.diagramUrl ? (
                      <span className="text-[11px] text-slate-500">Uploading again will replace the existing diagram.</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500">No template found for this body type.</div>
            )}
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

export default CarEntryModal;
