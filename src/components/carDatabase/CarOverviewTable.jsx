/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import TableToolbar from "../shared/TableToolbar";
import DataTable from "../shared/DataTable";
import StatusPill from "../shared/StatusPill";
import IconButton from "../shared/IconButton";
import Button from "../shared/Button";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { PiBatteryChargingBold } from "react-icons/pi";

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const missingValue = "--";

const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const CarOverviewTable = ({
  rows,
  loading,
  loadingMore = false,
  hasMore = false,
  page = 1,
  filters,
  onFilterChange,
  onNextPage,
  onPrevPage,
  onAddCar,
  onEditCar,
  onToggleStatus,
  onDeleteCar,
  onAssignMarker,
  pendingRowAction = null,
}) => {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  useEffect(() => setSearchValue(filters.search || ""), [filters.search]);

  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange && onFilterChange({ search: debouncedSearch });
    }
  }, [debouncedSearch, filters.search, onFilterChange]);

  const getRowActionState = useCallback((rowId) => {
    if (!pendingRowAction?.carId || pendingRowAction.carId !== rowId) {
      return { isPending: false, isDeletePending: false, isStatusPending: false };
    }

    const isDeletePending = pendingRowAction.type === "delete";
    const isStatusPending =
      pendingRowAction.type === "activate" || pendingRowAction.type === "deactivate";

    return {
      isPending: true,
      isDeletePending,
      isStatusPending,
    };
  }, [pendingRowAction]);

  const columns = useMemo(
    () => [
      { key: "make", label: "Make" },
      { key: "model", label: "Model" },
      {
        key: "yearRange",
        label: "Year Range",
        render: (row) => {
          const yf = row.yearFrom ?? row.year;
          const yt = row.yearTo ?? row.yearFrom ?? row.year;
          if (yf && yt) return `${yf}-${yt}`;
          if (yf) return yf;
          return missingValue;
        },
      },
      { key: "location", label: "Location", render: (row) => row.location || missingValue },
      { key: "bodyType", label: "Body Type", render: (row) => row.bodyType || missingValue },
      {
        key: "diagram",
        label: "Diagram",
        render: (row) => {
          const isUploaded = !!row.diagramUrl;
          const isTemplate = !row.diagramUrl && !!row.templateId;
          if (isUploaded) return <StatusPill status="active" label="Uploaded" />;
          if (isTemplate) return <StatusPill status="neutral" label="Template" />;
          return <StatusPill status="inactive" label="Missing" />;
        },
      },
      {
        key: "marker",
        label: "Marker",
        render: (row) => {
          const isSet = row.markerStatus === "set" && row.marker?.xPct != null;
          return isSet ? <StatusPill status="active" label="Set" /> : <StatusPill status="warning" label="Pending" />;
        },
      },
      {
        key: "status",
        label: "Status",
        render: (row) => {
          const { isStatusPending } = getRowActionState(row.id);
          return (
            <button
              type="button"
              onClick={() => onToggleStatus(row)}
              disabled={isStatusPending}
              className="inline-flex items-center gap-2 disabled:cursor-not-allowed"
            >
              {isStatusPending ? (
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"
                  aria-hidden
                />
              ) : null}
              {row.status === "active" ? (
                <StatusPill
                  status="active"
                  label="Active"
                  className={isStatusPending ? "opacity-70" : ""}
                />
              ) : (
                <StatusPill
                  status="inactive"
                  label="Inactive"
                  className={isStatusPending ? "opacity-70" : ""}
                />
              )}
            </button>
          );
        },
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => {
          const { isPending, isDeletePending } = getRowActionState(row.id);
          return (
            <div className="flex items-center gap-1">
              <IconButton size="sm" onClick={() => onEditCar(row)} disabled={isPending}>
                <FiEdit2 className="text-[13px]" />
              </IconButton>

              <IconButton
                size="sm"
                onClick={() => onAssignMarker(row)}
                title="Assign Marker"
                disabled={isPending}
              >
                <PiBatteryChargingBold className="text-[14px]" />
              </IconButton>

              <IconButton
                size="sm"
                variant="danger"
                onClick={() => onDeleteCar(row)}
                isLoading={isDeletePending}
                loadingText={null}
                disabled={isPending}
              >
                <FiTrash2 className="text-[13px]" />
              </IconButton>
            </div>
          );
        },
      },
    ],
    [getRowActionState, onAssignMarker, onDeleteCar, onEditCar, onToggleStatus]
  );

  return (
    <div className="space-y-3">
      <TableToolbar
        searchPlaceholder="Search by make/model/location/body type"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        leftContent={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              value={filters.status}
              onChange={(e) => onFilterChange && onFilterChange({ status: e.target.value })}
            >
              <option value="all">Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              value={filters.diagram || "all"}
              onChange={(e) => onFilterChange && onFilterChange({ diagram: e.target.value })}
            >
              <option value="all">Diagram</option>
              <option value="uploaded">Uploaded</option>
              <option value="missing">Missing</option>
            </select>
          </div>
        }
        rightContent={
          <Button size="sm" onClick={onAddCar}>
            Add New Car
          </Button>
        }
      />

      <div className="mt-1 overflow-x-auto">
        <DataTable
          columns={columns}
          data={rows}
          loading={loading || loadingMore}
          emptyMessage="No data for selected filters"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Page size</span>
          <select
            value={filters.pageSize}
            onChange={(e) => onFilterChange && onFilterChange({ pageSize: Number(e.target.value) })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#E53935]"
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        </div>

      <div className="flex items-center gap-3">
          <span className="text-slate-500">Page {page}</span>
          {!hasMore && rows.length > 0 && <span className="text-slate-400">End of results</span>}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1 || loading}
              onClick={onPrevPage}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="secondary"
              isLoading={loadingMore}
              disabled={!hasMore || loading || loadingMore}
              onClick={onNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarOverviewTable;
