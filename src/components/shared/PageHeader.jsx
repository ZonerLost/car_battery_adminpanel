import React from "react";

const PageHeader = ({ title, subtitle, rightSlot }) => {
  return (
    <div className="mb-4 flex flex-col gap-2 md:mb-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-[18px] md:text-[20px] font-semibold text-slate-900 leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {rightSlot && (
        <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
          {rightSlot}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
