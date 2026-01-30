import { useMemo, useState } from "react";
import TableToolbar from "../shared/TableToolbar";
import DataTable from "../shared/DataTable";
import Pagination from "../shared/Pagination";
import StatusPill from "../shared/StatusPill";
import IconButton from "../shared/IconButton";
import Button from "../shared/Button";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

const missingValue = "--";

function toYear(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function yearRangeOverlap(row, from, to) {
  const yf = toYear(row.yearFrom ?? row.year);
  const yt = toYear(row.yearTo ?? row.yearFrom ?? row.year);

  const rowStart = yf ?? yt;
  const rowEnd = yt ?? yf ?? rowStart;

  if (!from && !to) return true;
  const filterStart = toYear(from);
  const filterEnd = toYear(to);

  if (filterStart == null && filterEnd == null) return true;

  if (filterStart != null && filterEnd != null) {
    return (rowStart ?? -Infinity) <= filterEnd && (rowEnd ?? Infinity) >= filterStart;
  }
  if (filterStart != null) return (rowEnd ?? Infinity) >= filterStart;
  if (filterEnd != null) return (rowStart ?? -Infinity) <= filterEnd;
  return true;
}

const CarOverviewTable = ({
  cars,
  loading,
  onAddCar,
  onEditCar,
  onToggleStatus,
  onDeleteCar,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [yearFromFilter, setYearFromFilter] = useState("");
  const [yearToFilter, setYearToFilter] = useState("");
  const [showYearFilter, setShowYearFilter] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const filtered = useMemo(() => {
    return (cars || []).filter((car) => {
      const searchText = `${car.make} ${car.model} ${car.location || ""} ${car.bodyType || ""}`
        .toLowerCase()
        .trim();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : car.status === statusFilter;
      const matchesYear = yearRangeOverlap(car, yearFromFilter, yearToFilter);

      return matchesSearch && matchesStatus && matchesYear;
    });
  }, [cars, search, statusFilter, yearFromFilter, yearToFilter]);

  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  const columns = [
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
    {
      key: "location",
      label: "Location",
      render: (row) => row.location || missingValue,
    },
    {
      key: "bodyType",
      label: "Body Type",
      render: (row) => row.bodyType || missingValue,
    },
    {
      key: "reportsPending",
      label: "Reports Pending",
      render: (row) => Number(row.reportsPending || 0),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <button
          type="button"
          onClick={() => onToggleStatus(row)}
          className="inline-flex items-center"
        >
          {row.status === "active" ? (
            <StatusPill status="active" label="Active" />
          ) : (
            <StatusPill status="inactive" label="Inactive" />
          )}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <IconButton size="sm" onClick={() => onEditCar(row)}>
            <FiEdit2 className="text-[13px]" />
          </IconButton>
          <IconButton size="sm" variant="danger" onClick={() => onDeleteCar(row)}>
            <FiTrash2 className="text-[13px]" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <TableToolbar
        searchPlaceholder="Search by make/model/location/body type"
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        leftContent={
          <div className="flex flex-wrap items-center gap-2 relative">
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-50"
              onClick={() => setShowYearFilter((s) => !s)}
            >
              Year Range
            </button>

            {showYearFilter && (
              <div className="absolute z-20 top-11 left-0 w-72 rounded-xl border border-slate-200 bg-white shadow-lg p-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={yearFromFilter}
                    onChange={(e) => setYearFromFilter(e.target.value)}
                    placeholder="From (e.g. 2005)"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-[11px]"
                  />
                  <input
                    value={yearToFilter}
                    onChange={(e) => setYearToFilter(e.target.value)}
                    placeholder="To (e.g. 2010)"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-[11px]"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    className="text-[11px] text-slate-500 hover:text-slate-700"
                    onClick={() => {
                      setYearFromFilter("");
                      setYearToFilter("");
                      setPage(1);
                      setShowYearFilter(false);
                    }}
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    className="rounded-lg bg-[#E53935] text-white px-3 py-2 text-[11px]"
                    onClick={() => {
                      setPage(1);
                      setShowYearFilter(false);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        }
        rightContent={
          <Button size="sm" onClick={onAddCar}>
            Add New Car
          </Button>
        }
      />

      <div className="mt-1 overflow-x-auto">
        <DataTable columns={columns} data={pageRows} loading={loading} />
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
    </div>
  );
};

export default CarOverviewTable;
