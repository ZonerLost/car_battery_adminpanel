import React from "react";

const TextField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  helperText,
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
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`rounded-lg border px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-[#E53935] ${
          error ? "border-red-300" : "border-slate-200"
        }`}
        {...rest}
      />
      {helperText && !error && (
        <p className="text-[10px] text-slate-400">{helperText}</p>
      )}
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
};

export default TextField;
