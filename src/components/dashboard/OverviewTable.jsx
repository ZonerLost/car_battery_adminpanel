import { useMemo, useState } from "react";
import TableToolbar from "../shared/TableToolbar";
import DataTable from "../shared/DataTable";
import StatusPill from "../shared/StatusPill";
import IconButton from "../shared/IconButton";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import EditRowModal from "./EditRowModal";
import { buildYearRangeOptions } from "../../lib/dashboard/aggregateDashboard";

const DEFAULT_FILTERS = {
  search: "",
  diagram: "all",
  yearRange: "all",
};

const OverviewTable = ({
  rows = [],
  loading = false,
  page = 1,
  hasMore = false,
  onNextPage,
  onPrevPage,
  onDeleteRow,
  onEditRow,
  pendingDeleteId = null,
}) => {
  const [localFilters, setLocalFilters] = useState(DEFAULT_FILTERS);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const activeFilters = localFilters;

  const setFilter = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const yearOptions = useMemo(() => buildYearRangeOptions(rows), [rows]);

  const filtered = useMemo(() => {
    const s = activeFilters.search.toLowerCase().trim();
    const nowYear = new Date().getFullYear();

    return rows.filter((row) => {
      const text = `${row.make} ${row.model}`.toLowerCase();
      const matchesSearch = !s || text.includes(s);
      const matchesDiagram = activeFilters.diagram === "all" || row.diagramStatus === activeFilters.diagram;

      const rowFrom = Number.isFinite(row.yearFrom) ? row.yearFrom : Number.isFinite(row.yearTo) ? row.yearTo : null;
      const rowTo = Number.isFinite(row.yearTo) ? row.yearTo : rowFrom;

      let matchesYear = true;
      if (activeFilters.yearRange === "last5") {
        matchesYear = rowTo ? rowTo >= nowYear - 4 : false;
      } else if (activeFilters.yearRange !== "all") {
        const [a, b] = activeFilters.yearRange.split("-").map((n) => Number(n));
        if (Number.isFinite(a) && Number.isFinite(b)) {
          const from = Math.min(a, b);
          const to = Math.max(a, b);
          const start = rowFrom ?? rowTo;
          const end = rowTo ?? rowFrom;
          if (start == null && end == null) {
            matchesYear = false;
          } else {
            matchesYear = (start ?? end) <= to && (end ?? start) >= from;
          }
        }
      }

      return matchesSearch && matchesDiagram && matchesYear;
    });
  }, [rows, activeFilters]);

  const pageRows = filtered;

  const columns = [
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    {
      key: "yearLabel",
      label: "Year",
      render: (row) => row.yearLabel || "-",
    },
    {
      key: "diagramStatus",
      label: "Diagram Status",
      render: (row) => {
        if (row.diagramStatus === "uploaded") return <StatusPill status="success" label="Uploaded" />;
        if (row.diagramStatus === "template") return <StatusPill status="info" label="Template" />;
        if (row.diagramStatus === "pending") return <StatusPill status="warning" label="Pending" />;
        return <StatusPill status="missing" label="Missing" />;
      },
    },
    { key: "lastUploaded", label: "Last Uploaded" },
  ];

  const showActions = Boolean(onDeleteRow || onEditRow);

  if (showActions) {
    columns.push({
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          {onEditRow && (
            <IconButton
              size="sm"
              onClick={() => {
                setSelectedRow(row);
                setEditOpen(true);
              }}
              aria-label="Edit"
            >
              <FiEdit2 className="text-[13px]" />
            </IconButton>
          )}

          {onDeleteRow && (
            <IconButton
              size="sm"
              variant="danger"
              onClick={() => onDeleteRow?.(row)}
              disabled={pendingDeleteId === row.id}
              isLoading={pendingDeleteId === row.id}
              loadingText={null}
              aria-label="Delete"
            >
              <FiTrash2 className="text-[13px]" />
            </IconButton>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="space-y-3">
      <TableToolbar
        searchPlaceholder="Search by Make or Model"
        searchValue={activeFilters.search}
        onSearchChange={(v) => setFilter("search", v)}
        leftContent={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              value={activeFilters.diagram}
              onChange={(e) => setFilter("diagram", e.target.value)}
            >
              <option value="all">Diagram</option>
              <option value="uploaded">Uploaded</option>
              <option value="template">Template</option>
              <option value="pending">Pending</option>
              <option value="missing">Missing</option>
            </select>

            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              value={activeFilters.yearRange}
              onChange={(e) => setFilter("yearRange", e.target.value)}
            >
              {yearOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="mt-1 overflow-x-auto">
        <DataTable columns={columns} data={pageRows} loading={loading} emptyMessage="No cars found" />
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-500">Page {page}</span>
        <div className="flex gap-2">
          <button
            onClick={onPrevPage}
            disabled={page <= 1 || loading}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={onNextPage}
            disabled={!hasMore || loading}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      <EditRowModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        row={selectedRow}
        onSave={(updated) => onEditRow?.(updated)}
      />
    </div>
  );
};

export default OverviewTable;
