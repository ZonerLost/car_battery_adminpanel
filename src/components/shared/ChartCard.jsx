import React from "react";
import Card from "./Card";

const ChartCard = ({ title, rightSlot, children }) => {
  return (
    <Card className="p-4 flex flex-col gap-3 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {rightSlot && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {rightSlot}
          </div>
        )}
      </div>
      <div className="mt-1 flex-1 min-h-[260px] min-w-0">{children}</div>
    </Card>
  );
};

export default ChartCard;
