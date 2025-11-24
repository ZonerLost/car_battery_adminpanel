import React from "react";
import Card from "./Card";

const MetricCard = ({
  title,
  value,
  deltaLabel,
  deltaType = "neutral", // up | down | neutral
  helperText,
}) => {
  const deltaColors =
    deltaType === "up"
      ? "bg-emerald-50 text-emerald-700"
      : deltaType === "down"
      ? "bg-red-50 text-red-700"
      : "bg-slate-50 text-slate-600";

  return (
    <Card className="p-4 flex flex-col gap-2">
      {deltaLabel && (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${deltaColors}`}
        >
          {deltaLabel}
        </span>
      )}
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      {helperText && (
        <div className="text-[11px] text-slate-500 mt-1">{helperText}</div>
      )}
    </Card>
  );
};

export default MetricCard;
