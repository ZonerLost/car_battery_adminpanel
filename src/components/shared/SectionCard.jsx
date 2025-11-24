import React from "react";
import Card from "./Card";

const SectionCard = ({ title, description, actions, children, className = "" }) => {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div className="flex-1 min-w-0">
          {title && <h3 className="text-base font-semibold text-slate-900 leading-tight">{title}</h3>}
          {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
            {actions}
          </div>
        )}
      </div>
      {children}
    </Card>
  );
};

export default SectionCard;
