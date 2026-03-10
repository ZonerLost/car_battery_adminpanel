// import React, { useEffect, useState } from "react";
// import Modal from "../shared/Modal";
// import FormRow from "../shared/FormRow";
// import TextField from "../shared/TextField";
// import TextAreaField from "../shared/TextAreaField";
// import SelectField from "../shared/SelectField";
// import Button from "../shared/Button";
// import toast from "react-hot-toast";

// const EMPTY_VALUES = {
//   make: "",
//   model: "",
//   yearFrom: "",
//   yearTo: "",
//   bodyType: "",
//   location: "",
//   description: "",
//   status: "active",
// };

// function buildFormValues(mode, initialValues) {
//   if (mode === "edit" && initialValues) {
//     return {
//       make: initialValues.make ?? "",
//       model: initialValues.model ?? "",
//       yearFrom: initialValues.yearFrom != null ? String(initialValues.yearFrom) : "",
//       yearTo: initialValues.yearTo != null ? String(initialValues.yearTo) : "",
//       bodyType: initialValues.bodyType ?? "",
//       location: initialValues.location ?? "",
//       description: initialValues.description ?? "",
//       status: initialValues.status ?? "active",
//     };
//   }
//   return { ...EMPTY_VALUES };
// }

// const DiagramEntryModal = ({
//   isOpen,
//   mode = "add",
//   initialValues,
//   onClose,
//   onSubmit,
// }) => {
//   const [values, setValues] = useState(() => buildFormValues(mode, initialValues));
//   const [diagramFile, setDiagramFile] = useState(null);
//   const [thumbnailFile, setThumbnailFile] = useState(null);
//   const [errors, setErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState("");

//   useEffect(() => {
//     if (!isOpen) return;
//     setValues(buildFormValues(mode, initialValues));
//     setDiagramFile(null);
//     setThumbnailFile(null);
//     setErrors({});
//     setIsSubmitting(false);
//     setSubmitError("");
//   }, [isOpen, mode, initialValues]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setValues((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (isSubmitting) return;

//     if (!diagramFile && !initialValues?.diagramUrl) {
//       setErrors((prev) => ({ ...prev, diagram: "Battery diagram is required." }));
//       return;
//     }

//     setSubmitError("");
//     setIsSubmitting(true);

//     const toastId = `diagram-${mode}`;

//     try {
//       const payload = {
//         ...(initialValues || {}),
//         ...values,
//         yearFrom: values.yearFrom ? Number(values.yearFrom) : undefined,
//         yearTo: values.yearTo ? Number(values.yearTo) : undefined,
//       };

//       await onSubmit?.(payload, { diagramFile, thumbnailFile });
//       toast.success(mode === "edit" ? "Changes saved successfully" : "Diagram added successfully", { id: toastId });
//       onClose?.();
//     } catch (err) {
//       console.error(err);
//       const apiMessage =
//         err?.response?.data?.message ||
//         err?.response?.data?.error ||
//         (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors[0] : null) ||
//         err?.message ||
//         "Failed to save diagram. Please try again.";
//       setSubmitError(apiMessage);
//       toast.error(apiMessage, { id: toastId });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const title = mode === "edit" ? "Edit Diagram" : "Add New Diagram";
//   const primaryLabel = mode === "edit" ? "Save Changes" : "Add Diagram";

//   return (
//     <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" closeDisabled={isSubmitting}>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <FormRow className="md:grid-cols-2 gap-4">
//           <TextField
//             label="Car Make"
//             name="make"
//             value={values.make}
//             onChange={handleChange}
//             placeholder="Enter car brand (e.g., Toyota)"
//           />
//           <TextField
//             label="Car Model"
//             name="model"
//             value={values.model}
//             onChange={handleChange}
//             placeholder="Enter model name (e.g., Corolla)"
//           />
//         </FormRow>

//         <FormRow className="md:grid-cols-2 gap-4">
//           <TextField
//             label="Year From"
//             name="yearFrom"
//             type="number"
//             value={values.yearFrom}
//             onChange={handleChange}
//             placeholder="e.g., 2015"
//           />
//           <TextField
//             label="Year To"
//             name="yearTo"
//             type="number"
//             value={values.yearTo}
//             onChange={handleChange}
//             placeholder="e.g., 2017 (optional)"
//           />
//         </FormRow>

//         <FormRow className="md:grid-cols-2 gap-4">
//           <SelectField
//             label="Body Type"
//             name="bodyType"
//             value={values.bodyType}
//             onChange={handleChange}
//             options={[
//               { label: "Sedan", value: "Sedan" },
//               { label: "SUV", value: "SUV" },
//               { label: "Hatchback", value: "Hatchback" },
//               { label: "Truck", value: "Truck" },
//               { label: "Other", value: "Other" },
//             ]}
//             placeholder="Select body type"
//           />
//           <SelectField
//             label="Status"
//             name="status"
//             value={values.status}
//             onChange={handleChange}
//             options={[
//               { label: "Active", value: "active" },
//               { label: "Inactive", value: "inactive" },
//             ]}
//             placeholder="Select status"
//           />
//         </FormRow>

//         <TextField
//           label="Car Location"
//           name="location"
//           value={values.location}
//           onChange={handleChange}
//           placeholder="e.g., Pakistan"
//         />

//         <TextAreaField
//           label="Battery Location Description"
//           name="description"
//           value={values.description}
//           onChange={handleChange}
//           placeholder="Engine bay - right side near fuse box"
//           rows={4}
//         />

//         <div>
//           <div className="flex items-center gap-1 mb-2">
//             <span className="text-[11px] font-medium text-slate-700">
//               Upload Diagram (battery location)
//             </span>
//             <span className="text-red-500 text-[11px]">*</span>
//           </div>

//           <div className="flex flex-wrap gap-3 items-center">
//             {diagramFile ? (
//               <div className="w-56 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[10px]">
//                 <div className="truncate">{diagramFile.name}</div>
//                 <div className="text-[10px] text-slate-400">
//                   {(diagramFile.size / 1024).toFixed(1)} KB
//                 </div>
//               </div>
//             ) : null}

//             <label className="w-12 h-12 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white cursor-pointer text-xl text-slate-400">
//               +
//               <input
//                 type="file"
//                 className="hidden"
//                 accept=".png,.jpg,.jpeg,.svg,.webp"
//                 onChange={(e) => {
//                   const file = e.target.files?.[0] || null;
//                   setDiagramFile(file);
//                   if (file) setErrors((prev) => ({ ...prev, diagram: "" }));
//                 }}
//               />
//             </label>

//             {mode === "edit" && initialValues?.diagramUrl ? (
//               <span className="text-[11px] text-slate-500">
//                 Existing diagram uploaded. Uploading again will replace it.
//               </span>
//             ) : null}

//             {errors.diagram ? (
//               <span className="text-[11px] text-red-600">{errors.diagram}</span>
//             ) : null}
//           </div>
//         </div>

//         <div>
//           <div className="flex items-center gap-1 mb-2">
//             <span className="text-[11px] font-medium text-slate-700">
//               Upload Car Image (thumbnail)
//             </span>
//             <span className="text-[11px] text-slate-400">(optional)</span>
//           </div>

//           <div className="flex flex-wrap gap-3 items-center">
//             {thumbnailFile ? (
//               <div className="w-56 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[10px]">
//                 <div className="truncate">{thumbnailFile.name}</div>
//                 <div className="text-[10px] text-slate-400">
//                   {(thumbnailFile.size / 1024).toFixed(1)} KB
//                 </div>
//               </div>
//             ) : null}

//             <label className="w-12 h-12 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white cursor-pointer text-xl text-slate-400">
//               +
//               <input
//                 type="file"
//                 className="hidden"
//                 accept=".png,.jpg,.jpeg,.webp"
//                 onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
//               />
//             </label>

//             {mode === "edit" && initialValues?.thumbnailUrl ? (
//               <span className="text-[11px] text-slate-500">
//                 Existing thumbnail uploaded. Uploading again will replace it.
//               </span>
//             ) : null}
//           </div>
//         </div>

//         <div>
//           <span className="text-[11px] font-medium text-slate-700">Assign Battery Marker</span>
//           <div className="mt-2 flex items-center gap-3">
//             <div className="w-28 h-20 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400">
//               Marker preview
//             </div>
//             <span className="text-[11px] text-slate-500">
//               Use the "Assign Marker" action in the table to place the marker.
//             </span>
//           </div>
//         </div>

//         <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between">
//           <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={isSubmitting}>
//             {mode === "edit" ? "Close" : "Cancel"}
//           </Button>
//           <Button type="submit" fullWidth isLoading={isSubmitting} disabled={isSubmitting}>
//             {isSubmitting ? (mode === "edit" ? "Saving..." : "Adding...") : primaryLabel}
//           </Button>
//         </div>

//         {submitError ? <div className="text-xs text-red-600">{submitError}</div> : null}
//       </form>
//     </Modal>
//   );
// };

// export default DiagramEntryModal;


import React, { useEffect, useMemo, useState } from "react";
import Modal from "../shared/Modal";
import FormRow from "../shared/FormRow";
import TextField from "../shared/TextField";
import TextAreaField from "../shared/TextAreaField";
import SelectField from "../shared/SelectField";
import Button from "../shared/Button";
import toast from "react-hot-toast";

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
}) => {
  const [values, setValues] = useState(() => buildFormValues(mode, initialValues));
  const [diagramFile, setDiagramFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setValues(buildFormValues(mode, initialValues));
    setDiagramFile(null);
    setThumbnailFile(null);
    setSubmitError("");
    setIsSubmitting(false);
  }, [isOpen, mode, initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const computedTemplateId = useMemo(() => {
    return initialValues?.templateId || inferTemplateId(values.bodyType);
  }, [initialValues?.templateId, values.bodyType]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setSubmitError("");
    setIsSubmitting(true);

    const toastId = `car-entry-${mode}`;

    try {
      const payload = {
        ...(initialValues || {}),
        ...values,
        templateId: computedTemplateId,
        yearFrom: values.yearFrom ? Number(values.yearFrom) : undefined,
        yearTo: values.yearTo ? Number(values.yearTo) : undefined,
      };

      await onSubmit?.(payload, { diagramFile, thumbnailFile });
      toast.success(mode === "edit" ? "Changes saved successfully" : "Car added successfully", {
        id: toastId,
      });
      onClose?.();
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (Array.isArray(error?.response?.data?.errors) ? error.response.data.errors[0] : null) ||
        error?.message ||
        "Failed to save car. Please try again.";

      setSubmitError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === "edit" ? "Edit Car Entry" : "Add New Car Entry";
  const primaryLabel = mode === "edit" ? "Save Changes" : "Add Car";

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
          />
          <TextField
            label="Car Model"
            name="model"
            value={values.model}
            onChange={handleChange}
            placeholder="e.g., Corolla"
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
            placeholder="e.g., 2020 (optional)"
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

            <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-xl text-slate-400">
              +
              <input
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.webp"
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
            <span className="text-[11px] text-slate-400">(Using template by body type)</span>
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
                  Upload a custom diagram only if the template is not correct. Otherwise the app
                  will use the default template automatically.
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-xl text-slate-400">
                    +
                    <input
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.svg,.webp"
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
                </div>

                {computedTemplate?.label ? (
                  <div className="text-[11px] text-slate-500">
                    Template: <span className="font-medium text-slate-700">{computedTemplate.label}</span>
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
              using saved coordinates from Firestore.
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

          <Button type="submit" fullWidth isLoading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? (mode === "edit" ? "Saving..." : "Adding...") : primaryLabel}
          </Button>
        </div>

        {submitError ? <div className="text-xs text-red-600">{submitError}</div> : null}
      </form>
    </Modal>
  );
};

export default DiagramEntryModal;