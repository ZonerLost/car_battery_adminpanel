/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../shared/Modal";
import FormRow from "../shared/FormRow";
import TextField from "../shared/TextField";
import SelectField from "../shared/SelectField";
import Button from "../shared/Button";
import { DEFAULT_ROLE, ROLE_OPTIONS, sanitizeRole } from "../../types/user";

const emptyForm = { name: "", email: "", status: "active", role: DEFAULT_ROLE };

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
  canEditRole = true,
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
            role: initialValues.role || DEFAULT_ROLE,
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
    const role = sanitizeRole(values.role || DEFAULT_ROLE);

    if (!name) return setError("Name is required.");
    if (!email || !isValidEmail(email)) return setError("Enter a valid email.");

    const previousRole = sanitizeRole(initialValues?.role || DEFAULT_ROLE);
    if (mode === "edit" && canEditRole && previousRole !== "admin" && role === "admin") {
      const confirmed = window.confirm(
        "Promote this user to admin? Admins get full access to the portal."
      );
      if (!confirmed) return;
    }

    const payload = { name, email, status, role: canEditRole ? role : previousRole };
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
            label="Role"
            name="role"
            value={values.role}
            onChange={handleChange}
            options={ROLE_OPTIONS}
            disabled={loading || !canEditRole}
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
