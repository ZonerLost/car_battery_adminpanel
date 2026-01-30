/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../shared/Modal";
import FormRow from "../shared/FormRow";
import TextField from "../shared/TextField";
import SelectField from "../shared/SelectField";
import Button from "../shared/Button";

const emptyForm = { name: "", email: "", status: "active" };

const isValidEmail = (value) => {
  const v = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

const AddRoleModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode = "create", // "create" | "edit"
  initialValues = null,
  loading = false,
}) => {
  const [values, setValues] = useState(emptyForm);
  const [error, setError] = useState("");

  const title = useMemo(() => (mode === "edit" ? "Edit User" : "Add New User"), [mode]);
  const submitLabel = useMemo(() => (mode === "edit" ? "Save Changes" : "Save & Continue"), [mode]);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setValues(
      initialValues
        ? {
            name: initialValues.name || "",
            email: initialValues.email || "",
            status: initialValues.status || "active",
          }
        : emptyForm
    );
  }, [isOpen, initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    const name = String(values.name || "").trim();
    const email = String(values.email || "").trim().toLowerCase();
    const status = values.status || "active";

    if (!name) return setError("Name is required.");
    if (!email || !isValidEmail(email)) return setError("Enter a valid email.");

    const payload = { name, email, status };
    await onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSave} className="space-y-3">
        <FormRow className="md:grid-cols-1">
          <TextField
            label="Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            placeholder="Enter name i.e. Kashan"
            disabled={loading}
          />
        </FormRow>

        <FormRow className="md:grid-cols-1">
          <TextField
            label="Email"
            name="email"
            value={values.email}
            onChange={handleChange}
            placeholder="Enter email i.e. maherkashan7@gmail.com"
            type="email"
            disabled={loading}
          />
        </FormRow>

        <FormRow className="md:grid-cols-1">
          <SelectField
            label="Status"
            name="status"
            value={values.status}
            onChange={handleChange}
            options={[
              { label: "Active", value: "active" },
              { label: "Suspended", value: "suspended" },
            ]}
            disabled={loading}
          />
        </FormRow>

        {error ? <p className="text-xs text-red-600">{error}</p> : null}

        <div className="mt-4 flex flex-col sm:flex-row justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" size="md" fullWidth disabled={loading}>
            {loading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddRoleModal;
