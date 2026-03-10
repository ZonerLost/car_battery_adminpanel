import { useMemo, useState } from "react";
import TableToolbar from "../shared/TableToolbar";
import DataTable from "../shared/DataTable";
import Pagination from "../shared/Pagination";
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
  filters,
  onFiltersChange,
  onDeleteRow,
  onEditRow,
  pendingDeleteId = null,
}) => {
  const [localFilters, setLocalFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const activeFilters = filters || localFilters;

  const setFilter = (key, value) => {
    const next = { ...activeFilters, [key]: value };
    if (onFiltersChange) onFiltersChange(next);
    else setLocalFilters(next);
    setPage(1);
  };

  const yearOptions = useMemo(() => buildYearRangeOptions(rows), [rows]);

  const filtered = useMemo(() => {
    const s = activeFilters.search.toLowerCase().trim();
    const nowYear = new Date().getFullYear();

    return rows.filter((row) => {
      const text = `${row.make} ${row.model}`.toLowerCase();
      const matchesSearch = !s || text.includes(s);

      const matchesDiagram = activeFilters.diagram === "all" || row.diagramStatus === activeFilters.diagram;
      const matchesMarker = true;

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
            const overlapStart = start ?? end;
            const overlapEnd = end ?? start;
            matchesYear = overlapStart <= to && overlapEnd >= from;
          }
        }
      }

      return matchesSearch && matchesDiagram && matchesMarker && matchesYear;
    });
  }, [rows, activeFilters]);

  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

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
        if (row.diagramStatus === "missing") return <StatusPill status="missing" label="Missing" />;
        return <span className="text-xs text-slate-600">-</span>;
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

      <Pagination
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

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
