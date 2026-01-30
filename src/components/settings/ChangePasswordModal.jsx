import React, { useEffect, useState } from "react";
import Modal from "../shared/Modal";
import FormRow from "../shared/FormRow";
import TextField from "../shared/TextField";
import Button from "../shared/Button";

import { changeMyPassword } from "../../api/settings/settingsHelper";

const emptyForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [values, setValues] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValues(emptyForm);
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    const currentPassword = String(values.currentPassword || "");
    const newPassword = String(values.newPassword || "");
    const confirmPassword = String(values.confirmPassword || "");

    if (!currentPassword) return setError("Current password is required.");
    if (newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await changeMyPassword({ currentPassword, newPassword });
      onClose();
    } catch (err) {
      console.error(err);
      // Common Firebase errors: auth/wrong-password, auth/requires-recent-login
      setError(err?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password" size="md">
      <form onSubmit={handleSave} className="space-y-3">
        <FormRow className="md:grid-cols-1">
          <TextField
            label="Current Password"
            name="currentPassword"
            type="password"
            value={values.currentPassword}
            onChange={handleChange}
            placeholder="Enter old password"
            disabled={loading}
          />
        </FormRow>

        <FormRow className="md:grid-cols-1">
          <TextField
            label="New Password"
            name="newPassword"
            type="password"
            value={values.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            disabled={loading}
          />
        </FormRow>

        <FormRow className="md:grid-cols-1">
          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
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
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
