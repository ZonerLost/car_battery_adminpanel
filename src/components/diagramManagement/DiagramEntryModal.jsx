/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../shared/Modal";
import FormRow from "../shared/FormRow";
import TextField from "../shared/TextField";
import TextAreaField from "../shared/TextAreaField";
import SelectField from "../shared/SelectField";
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

const DiagramEntryModal = ({
  isOpen,
  mode = "add",
  initialValues,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitError = "",
}) => {
  const [values, setValues] = useState(() => buildFormValues(mode, initialValues));
  const [diagramFile, setDiagramFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setValues(buildFormValues(mode, initialValues));
    setDiagramFile(null);
    setThumbnailFile(null);
  }, [isOpen, mode, initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const computedTemplateId = useMemo(() => {
    if (values.bodyType) {
      return inferTemplateId(values.bodyType);
    }

    if (initialValues?.templateId) {
      return initialValues.templateId;
    }

    return inferTemplateId(initialValues?.bodyType);
  }, [initialValues?.bodyType, initialValues?.templateId, values.bodyType]);

  const computedTemplate = useMemo(() => {
    return getTemplate(computedTemplateId);
  }, [computedTemplateId]);

  const previewUrl = useMemo(() => {
    if (diagramFile) return URL.createObjectURL(diagramFile);
    return initialValues?.diagramUrl || computedTemplate?.src || "";
  }, [diagramFile, initialValues?.diagramUrl, computedTemplate?.src]);

  useEffect(() => {
    return () => {
      if (diagramFile && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [diagramFile, previewUrl]);

  const previewMode = initialValues?.diagramUrl || diagramFile ? "custom" : computedTemplate?.src ? "template" : "missing";

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      ...(initialValues || {}),
      ...values,
      templateId: computedTemplateId,
      yearFrom: values.yearFrom ? Number(values.yearFrom) : undefined,
      yearTo: values.yearTo ? Number(values.yearTo) : undefined,
    };

    await onSubmit?.(payload, { diagramFile, thumbnailFile });
  };

  const title = mode === "edit" ? "Edit Car Entry" : "Add New Car Entry";
  const primaryLabel = mode === "edit" ? "Save Changes" : "Add Car";
  const submitLoadingLabel =
    mode === "edit"
      ? diagramFile
        ? "Uploading..."
        : "Updating..."
      : "Saving...";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" closeDisabled={isSubmitting}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow className="md:grid-cols-2 gap-4">
          <TextField
            label="Car Make"
            name="make"
            value={values.make}
            onChange={handleChange}
            placeholder="e.g., Toyota"
            disabled={isSubmitting}
          />
          <TextField
            label="Car Model"
            name="model"
            value={values.model}
            onChange={handleChange}
            placeholder="e.g., Corolla"
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
          <TextField
            label="Year To"
            name="yearTo"
            type="number"
            value={values.yearTo}
            onChange={handleChange}
            placeholder="e.g., 2020 (optional)"
            disabled={isSubmitting}
          />
        </FormRow>

        <FormRow className="md:grid-cols-2 gap-4">
          <SelectField
            label="Body Type"
            name="bodyType"
            value={values.bodyType}
            onChange={handleChange}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
          disabled={isSubmitting}
        />

        <TextAreaField
          label="Battery Location Description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="Engine bay - right side near fuse box"
          rows={4}
          disabled={isSubmitting}
        />

        <div>
          <div className="mb-2 flex items-center gap-1">
            <span className="text-[11px] font-medium text-slate-700">
              Upload Car Image (thumbnail)
            </span>
            <span className="text-[11px] text-slate-400">(optional)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {thumbnailFile ? (
              <div className="w-56 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[10px]">
                <div className="truncate">{thumbnailFile.name}</div>
                <div className="text-[10px] text-slate-400">
                  {(thumbnailFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ) : null}

            <label
              className={`flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-xl text-slate-400 ${
                isSubmitting ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
            >
              +
              <input
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.webp"
                disabled={isSubmitting}
                onChange={(event) => setThumbnailFile(event.target.files?.[0] || null)}
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
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-700">Battery Diagram</span>
            <span className="text-[11px] text-slate-400">
              {previewMode === "custom"
                ? "(Using uploaded diagram)"
                : previewMode === "template"
                  ? "(Using template by body type)"
                  : "(No preview available)"}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start gap-3">
              <div className="h-36 w-20 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Battery diagram preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-slate-400">
                    Select body type to load template
                  </div>
                )}
              </div>

              <div className="flex min-h-36 flex-1 flex-col justify-start gap-3">
                <div className="text-[11px] text-slate-500">
                  Upload a custom diagram only if the default body-type template is not correct.
                  If no custom image is uploaded, the app will use the template automatically.
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label
                    className={`flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-xl text-slate-400 ${
                      isSubmitting ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    }`}
                  >
                    +
                    <input
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      disabled={isSubmitting}
                      onChange={(event) => setDiagramFile(event.target.files?.[0] || null)}
                    />
                  </label>

                  {diagramFile ? (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px]">
                      <div className="truncate">{diagramFile.name}</div>
                      <div className="text-slate-400">
                        {(diagramFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  ) : null}

                  {mode === "edit" && initialValues?.diagramUrl ? (
                    <span className="text-[11px] text-slate-500">
                      Uploading again will replace the existing custom diagram.
                    </span>
                  ) : null}
                </div>

                {computedTemplate?.label ? (
                  <div className="text-[11px] text-slate-500">
                    Template:{" "}
                    <span className="font-medium text-slate-700">{computedTemplate.label}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium text-slate-700">Assign Battery Marker</span>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-20 w-28 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
              Marker preview
            </div>
            <span className="text-[11px] text-slate-500">
              Use the "Assign Marker" action after save. The app will render the battery location
              from Firestore marker.xPct and marker.yPct.
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={isSubmitting}
          >
            {mode === "edit" ? "Close" : "Cancel"}
          </Button>

          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            loadingText={submitLoadingLabel}
            disabled={isSubmitting}
          >
            {primaryLabel}
          </Button>
        </div>

        {submitError ? <div className="text-xs text-red-600">{submitError}</div> : null}
      </form>
    </Modal>
  );
};

export default DiagramEntryModal;
