import React from "react";
import Button from "./Button";

const TableToolbar = ({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  leftContent,
  rightButtonLabel,
  onRightButtonClick,
  rightContent, // if you want to pass custom instead of button
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex-1 w-full flex flex-wrap items-center gap-2">
        <input
          type="text"
          className="w-full sm:max-w-xs md:max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#E53935]"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
        />
        {leftContent && <div className="flex flex-wrap items-center gap-2">{leftContent}</div>}
      </div>

      <div className="flex items-center gap-2 justify-start sm:justify-end">
        {rightContent ||
          (rightButtonLabel && (
            <Button size="sm" onClick={onRightButtonClick}>
              {rightButtonLabel}
            </Button>
          ))}
      </div>
    </div>
  );
};

export default TableToolbar;
