import React, { useState } from "react";
import FormRow from "../shared/FormRow";
import TextField from "../shared/TextField";

const SettingsProfileForm = () => {
  const [values, setValues] = useState({
    platformName: "FireFighter - Super Admin",
    fullName: "admin",
    email: "admin@example.com",
    phone: "+971-55-987-6543",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  // In future you can add onBlur or Save button; Figma shows inline editing.
  return (
    <form className="space-y-3">
      <FormRow className="gap-4">
        <TextField
          label="Platform Name"
          name="platformName"
          value={values.platformName}
          onChange={handleChange}
        />
        <TextField
          label="Full Name"
          name="fullName"
          value={values.fullName}
          onChange={handleChange}
        />
      </FormRow>

      <FormRow className="gap-4">
        <TextField
          label="Phone Number"
          name="phone"
          value={values.phone}
          onChange={handleChange}
        />
        <TextField
          label="Contact Email"
          name="email"
          value={values.email}
          onChange={handleChange}
          type="email"
        />
      </FormRow>
    </form>
  );
};

export default SettingsProfileForm;
