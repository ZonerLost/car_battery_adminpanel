import React, { useState, useEffect } from "react";
import Modal from "../shared/Modal";
import FormRow from "../shared/FormRow";
import TextField from "../shared/TextField";
import SelectField from "../shared/SelectField";
import Button from "../shared/Button";

const emptyForm = {
  name: "",
  email: "",
  role: "",
};

const AddRoleModal = ({ isOpen, onClose, onSubmit }) => {
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
    if (!values.name || !values.email || !values.role) return;
    onSubmit(values);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Role" size="md">
      <form onSubmit={handleSave} className="space-y-3">
        <FormRow className="md:grid-cols-1">
          <TextField
            label="Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            placeholder="Enter name i.e. Kashan"
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
          />
        </FormRow>

        <FormRow className="md:grid-cols-1">
          <SelectField
            label="Role"
            name="role"
            value={values.role}
            onChange={handleChange}
            options={[
              { label: "Manager", value: "Manager" },
              { label: "Staff", value: "Staff" },
              { label: "Viewer", value: "Viewer" },
            ]}
            placeholder="Select role"
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

export default AddRoleModal;
