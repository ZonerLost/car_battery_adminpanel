import React, { useState } from "react";
import FormRow from "../shared/FormRow";
import SelectField from "../shared/SelectField";

const SettingsPreferencesForm = () => {
  const [values, setValues] = useState({
    defaultDashboardView: "dashboard",
    timezone: "gst",
    language: "en",
    dateFormat: "ddmmyyyy",
    currencyDisplayStyle: "symbol",
    graphComparison: "month",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form className="space-y-3">
      <FormRow className="md:grid-cols-3 gap-4">
        <SelectField
          label="Default Dashboard View"
          name="defaultDashboardView"
          value={values.defaultDashboardView}
          onChange={handleChange}
          options={[
            { label: "Dashboard", value: "dashboard" },
            { label: "Car Database", value: "car-db" },
          ]}
        />
        <SelectField
          label="Default Timezone"
          name="timezone"
          value={values.timezone}
          onChange={handleChange}
          options={[
            { label: "GST (Dubai)", value: "gst" },
            { label: "GMT", value: "gmt" },
          ]}
        />
        <SelectField
          label="Language Preference"
          name="language"
          value={values.language}
          onChange={handleChange}
          options={[
            { label: "English", value: "en" },
            { label: "Arabic", value: "ar" },
          ]}
        />
      </FormRow>

      <FormRow className="md:grid-cols-3 gap-4">
        <SelectField
          label="Date Format"
          name="dateFormat"
          value={values.dateFormat}
          onChange={handleChange}
          options={[
            { label: "DD/MM/YYYY", value: "ddmmyyyy" },
            { label: "MM/DD/YYYY", value: "mmddyyyy" },
          ]}
        />
        <SelectField
          label="Currency Display Style"
          name="currencyDisplayStyle"
          value={values.currencyDisplayStyle}
          onChange={handleChange}
          options={[
            { label: "Symbol", value: "symbol" },
            { label: "Code", value: "code" },
          ]}
        />
        <SelectField
          label="Default Graph Comparison"
          name="graphComparison"
          value={values.graphComparison}
          onChange={handleChange}
          options={[
            { label: "Month", value: "month" },
            { label: "Week", value: "week" },
          ]}
        />
      </FormRow>
    </form>
  );
};

export default SettingsPreferencesForm;
