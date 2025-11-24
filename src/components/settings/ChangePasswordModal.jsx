import React, { useState, useEffect } from "react";
import Modal from "../shared/Modal";
import FormRow from "../shared/FormRow";
import TextField from "../shared/TextField";
import Button from "../shared/Button";

const emptyForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [values, setValues] = useState(emptyForm);

  useEffect(() => {
    if (isOpen) setValues(emptyForm);
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    // TODO: call API here
    onClose();
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
          />
        </FormRow>

        <div className="mt-4 flex flex-col sm:flex-row justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" size="md" fullWidth>
            Save &amp; Continue
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
