import React from "react";

const colorMap = {
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
  },
  danger: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
  },
};

const Alert = ({ type = "info", title, children, className }) => {
  const color = colorMap[type] || colorMap.info;

  return (
    <div
      className={`flex gap-2 rounded-lg border px-3 py-2 text-xs ${color.bg} ${color.border} ${color.text} ${className}`}
    >
      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
      <div>
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div className="leading-snug">{children}</div>
      </div>
    </div>
  );
};

export default Alert;
