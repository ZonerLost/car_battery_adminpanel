import React from "react";

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  error,
  className = "",
  ...rest
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-[11px] font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`rounded-lg border px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-[#E53935] ${
          error ? "border-red-300" : "border-slate-200"
        }`}
        {...rest}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
};

export default SelectField;
