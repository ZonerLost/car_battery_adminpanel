import React, { useState, useMemo } from "react";
import TableToolbar from "../shared/TableToolbar";
import DataTable from "../shared/DataTable";
import Pagination from "../shared/Pagination";
import StatusPill from "../shared/StatusPill";
import IconButton from "../shared/IconButton";
import Button from "../shared/Button";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

const CarOverviewTable = ({
  cars,
  onAddCar,
  onEditCar,
  onToggleStatus,
  onDeleteCar,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const filtered = useMemo(() => {
    return cars.filter((car) => {
      const searchText = `${car.make} ${car.model} ${car.role}`.toLowerCase();
      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : car.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cars, search, statusFilter]);

  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  const columns = [
    { key: "make", label: "Name" },
    { key: "model", label: "Email" }, // Matches Figma labels (brand/model)
    { key: "year", label: "Location" },
    { key: "role", label: "Role" },
    {
      key: "reportsPending",
      label: "Reports Pending",
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
            <StatusPill status="missing" label="Inactive" />
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
          <IconButton
            size="sm"
            variant="danger"
            onClick={() => onDeleteCar(row)}
          >
            <FiTrash2 className="text-[13px]" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <TableToolbar
        searchPlaceholder="Search by Name or Email"
        searchValue={search}
        onSearchChange={setSearch}
        leftContent={
          <div className="flex flex-wrap items-center gap-2">
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
            >
              Year Range
            </button>
          </div>
        }
        rightContent={
          <Button size="sm" onClick={onAddCar}>
            Add New Car
          </Button>
        }
      />

      <div className="mt-1 overflow-x-auto">
        <DataTable columns={columns} data={pageRows} />
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
