import React from "react";

const TextAreaField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  className,
  ...rest
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-[11px] font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`rounded-lg border px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-[#E53935] resize-none ${
          error ? "border-red-300" : "border-slate-200"
        }`}
        {...rest}
      />
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
};

export default TextAreaField;
