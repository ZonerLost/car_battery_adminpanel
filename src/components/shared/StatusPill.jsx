import React from "react";

const STATUS_CONFIG = {
  success: {
    label: "Success",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  missing: {
    label: "Missing",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  inactive: {
    label: "Inactive",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  active: {
    label: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  danger: {
    label: "Danger",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
};

const StatusPill = ({ status, label, className }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {label || config.label}
    </span>
  );
};

export default StatusPill;
export { STATUS_CONFIG };
