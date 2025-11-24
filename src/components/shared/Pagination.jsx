import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Pagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    onPageChange && onPageChange(p);
  };

  return (
    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between text-[11px] text-slate-600">
      <div>
        Showing{" "}
        <span className="font-semibold">
          {(page - 1) * pageSize + 1}
        </span>{" "}
        -{" "}
        <span className="font-semibold">
          {Math.min(page * pageSize, total)}
        </span>{" "}
        of <span className="font-semibold">{total}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={pageSize}
          onChange={(e) =>
            onPageSizeChange && onPageSizeChange(Number(e.target.value))
          }
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#E53935]"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt} / page
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <FiChevronLeft className="text-xs" />
          </button>
          <span className="px-1">
            {page} / {totalPages}
          </span>
          <button
            className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
          >
            <FiChevronRight className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
