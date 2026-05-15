/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiInfo } from "react-icons/fi";
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
  const [adminConfirmed, setAdminConfirmed] = useState(false);

  const title = useMemo(() => (mode === "edit" ? "Edit User" : "Add New User"), [mode]);
  const submitLabel = useMemo(() => (mode === "edit" ? "Save Changes" : "Add User"), [mode]);

  const isPromotingToAdmin = useMemo(() => {
    const previousRole = sanitizeRole(initialValues?.role || DEFAULT_ROLE);
    return (
      mode === "edit" &&
      canEditRole &&
      previousRole !== "admin" &&
      sanitizeRole(values.role) === "admin"
    );
  }, [mode, canEditRole, initialValues?.role, values.role]);

  const isNewAdmin = mode === "create" && sanitizeRole(values.role) === "admin";

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setAdminConfirmed(false);
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

  // Reset confirmation when role changes away from admin
  useEffect(() => {
    if (sanitizeRole(values.role) !== "admin") setAdminConfirmed(false);
  }, [values.role]);

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
    if (!email || !isValidEmail(email)) return setError("Enter a valid email address.");

    if ((isPromotingToAdmin || isNewAdmin) && !adminConfirmed) {
      return setError("Please confirm you understand the admin access note below.");
    }

    const payload = { name, email, status, role: canEditRole ? role : sanitizeRole(initialValues?.role || DEFAULT_ROLE) };
    await onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSave} className="space-y-3">
        {mode === "create" && (
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <FiInfo className="mt-0.5 shrink-0 text-blue-500" size={13} />
            <p className="text-[11px] text-blue-700 leading-relaxed">
              A Firebase account will be created and a password-setup email will be sent to the user automatically.
            </p>
          </div>
        )}

        <FormRow className="md:grid-cols-1">
          <TextField
            label="Full Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            placeholder="e.g. John Smith"
            disabled={loading}
          />
        </FormRow>

        <FormRow className="md:grid-cols-1">
          <TextField
            label="Email Address"
            name="email"
            value={values.email}
            onChange={handleChange}
            placeholder="e.g. john@example.com"
            type="email"
            disabled={loading || mode === "edit"}
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

        {(isPromotingToAdmin || isNewAdmin) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 space-y-2">
            <div className="flex items-start gap-2">
              <FiAlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={13} />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Admin access requires a custom Firebase claim.</strong> After creating this user,
                go to <strong>Firebase Console → Authentication</strong> and run the{" "}
                <code className="bg-amber-100 px-1 rounded text-[10px]">scripts/createAdmin.js</code> script
                with this user's email to grant full admin panel access.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={adminConfirmed}
                onChange={(e) => setAdminConfirmed(e.target.checked)}
                disabled={loading}
                className="rounded border-amber-400 accent-amber-500"
              />
              <span className="text-[11px] text-amber-800 font-medium">
                I understand — I'll set the admin claim manually
              </span>
            </label>
          </div>
        )}

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
          <Button
            type="submit"
            size="md"
            fullWidth
            disabled={loading}
            isLoading={loading}
            loadingText={mode === "create" ? "Creating..." : "Saving..."}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddRoleModal;
