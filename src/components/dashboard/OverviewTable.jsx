import React, { useState } from "react";
import TableToolbar from "../shared/TableToolbar";
import DataTable from "../shared/DataTable";
import Pagination from "../shared/Pagination";
import StatusPill from "../shared/StatusPill";
import IconButton from "../shared/IconButton";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import EditRowModal from "./EditRowModal";

// fallback sample data – still here, used if `rows` prop is not passed
const ROWS = [
  {
    id: 1,
    make: "Toyota",
    model: "Corolla",
    year: 2018,
    diagramStatus: "uploaded",
    markerStatus: "pending",
    lastUploaded: "Jan 1",
  },
  {
    id: 2,
    make: "Honda",
    model: "Civic",
    year: 2019,
    diagramStatus: "missing",
    markerStatus: "not-assigned",
    lastUploaded: "Feb 3",
  },
  {
    id: 3,
    make: "Ford",
    model: "Focus",
    year: 2016,
    diagramStatus: "uploaded",
    markerStatus: "success",
    lastUploaded: "Mar 9",
  },
  {
    id: 4,
    make: "Chevrolet",
    model: "Camaro",
    year: 2017,
    diagramStatus: "missing",
    markerStatus: "pending",
    lastUploaded: "Apr 1",
  },
  {
    id: 5,
    make: "Nissan",
    model: "Sentra",
    year: 2018,
    diagramStatus: "uploaded",
    markerStatus: "success",
    lastUploaded: "Jun 1",
  },
  {
    id: 6,
    make: "Hyundai",
    model: "Elantra",
    year: 2020,
    diagramStatus: "uploaded",
    markerStatus: "success",
    lastUploaded: "Jun 5",
  },
];

const OverviewTable = ({ rows, onDeleteRow, onEditRow }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // Use rows from parent if provided, otherwise fallback to local sample
  const dataSource = rows && rows.length ? rows : ROWS;

  const filtered = dataSource.filter((row) => {
    const text = `${row.make} ${row.model}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  const columns = [
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    { key: "year", label: "Year" },
    {
      key: "diagramStatus",
      label: "Diagram Status",
      render: (row) => {
        if (row.diagramStatus === "uploaded") {
          return <StatusPill status="success" label="Uploaded" />;
        }
        if (row.diagramStatus === "missing") {
          return <StatusPill status="missing" label="Missing" />;
        }
        return <span className="text-xs text-slate-600">-</span>;
      },
    },
    {
      key: "markerStatus",
      label: "Marker Status",
      render: (row) => {
        if (row.markerStatus === "success") {
          return <StatusPill status="success" label="Set" />;
        }
        if (row.markerStatus === "pending") {
          return <StatusPill status="pending" label="Pending" />;
        }
        if (row.markerStatus === "not-assigned") {
          return <StatusPill status="inactive" label="Not Assigned" />;
        }
        return <span className="text-xs text-slate-600">-</span>;
      },
    },
    { key: "lastUploaded", label: "Last Uploaded" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          {/* Edit Button */}
          <IconButton
            size="sm"
            onClick={() => {
              setSelectedRow(row);
              setEditOpen(true);
            }}
          >
            <FiEdit2 className="text-[13px]" />
          </IconButton>

          {/* Delete Button – opens confirm via parent */}
          <IconButton
            size="sm"
            variant="danger"
            onClick={() => {
              if (onDeleteRow) onDeleteRow(row);
            }}
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
        searchPlaceholder="Search by Make or Model"
        searchValue={search}
        onSearchChange={setSearch}
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

      <EditRowModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        row={selectedRow}
        onSave={(updated) => {
          // bubble up to parent if provided
          if (onEditRow) onEditRow(updated);
        }}
      />
    </div>
  );
};

export default OverviewTable;
