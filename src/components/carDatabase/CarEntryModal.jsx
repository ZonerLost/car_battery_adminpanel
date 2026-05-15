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

const CarEntryModal = ({
  isOpen,
  mode = "add",
  initialValues,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitError = "",
}) => {
  const [values, setValues] = useState(() => buildFormValues(mode, initialValues));

  useEffect(() => {
    if (!isOpen) return;
    setValues(buildFormValues(mode, initialValues));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const payload = {
      ...(initialValues || {}),
      ...values,
      yearFrom: values.yearFrom ? Number(values.yearFrom) : undefined,
      yearTo: values.yearTo ? Number(values.yearTo) : undefined,
      templateId: inferTemplateId(values.bodyType),
    };

    await onSubmit?.(payload, {});
  };

  const title = mode === "edit" ? "Edit Car Entry" : "Add New Car Entry";
  const primaryLabel = mode === "edit" ? "Save Changes" : "Add Car";
  const submitLoadingLabel = mode === "edit" ? "Updating..." : "Saving...";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      className="hide-scrollbar"
      closeDisabled={isSubmitting}
    >
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

        {/* Diagram preview (template only) */}
        {effectiveDiagramPreview ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-medium text-slate-700">Battery Diagram</span>
              <span className="text-[11px] text-slate-500">(template by body type)</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="relative w-28 h-44 rounded-lg bg-white border border-slate-200 overflow-hidden">
                <img
                  src={effectiveDiagramPreview}
                  alt="Diagram preview"
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={isSubmitting}>
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

export default CarEntryModal;
