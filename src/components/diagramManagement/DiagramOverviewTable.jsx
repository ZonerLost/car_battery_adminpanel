import React, { useMemo, useState } from "react";
import TableToolbar from "../shared/TableToolbar";
import DataTable from "../shared/DataTable";
import Pagination from "../shared/Pagination";
import StatusPill from "../shared/StatusPill";
import IconButton from "../shared/IconButton";
import Button from "../shared/Button";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

const DiagramOverviewTable = ({
  diagrams,
  onAddDiagram,
  onEditDiagram,
  onDeleteDiagram,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const filtered = useMemo(() => {
    return diagrams.filter((d) => {
      const searchText = `${d.make} ${d.model} ${d.year}`.toLowerCase();
      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : d.diagramStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [diagrams, search, statusFilter]);

  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  const renderDiagramStatus = (row) => {
    if (row.diagramStatus === "uploaded") {
      return <StatusPill status="success" label="Uploaded" />;
    }
    if (row.diagramStatus === "missing") {
      return <StatusPill status="missing" label="Missing" />;
    }
    return <span className="text-xs text-slate-500">—</span>;
  };

  const renderMarkerStatus = (row) => {
    if (row.markerStatus === "set") {
      return <StatusPill status="success" label="Set" />;
    }
    if (row.markerStatus === "pending") {
      return <StatusPill status="pending" label="Pending" />;
    }
    if (row.markerStatus === "not-assigned") {
      return <StatusPill status="inactive" label="Not Assigned" />;
    }
    return <span className="text-xs text-slate-500">—</span>;
  };

  const columns = [
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    { key: "year", label: "Year" },
    {
      key: "diagramStatus",
      label: "Diagram Status",
      render: renderDiagramStatus,
    },
    {
      key: "markerStatus",
      label: "Marker Status",
      render: renderMarkerStatus,
    },
    {
      key: "lastUpdated",
      label: "Last Updated",
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <IconButton size="sm" onClick={() => onEditDiagram(row)}>
            <FiEdit2 className="text-[13px]" />
          </IconButton>

          <IconButton
            size="sm"
            variant="danger"
            onClick={() => onDeleteDiagram(row)}
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
              <option value="uploaded">Uploaded</option>
              <option value="missing">Missing</option>
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
          <Button size="sm" onClick={onAddDiagram}>
            Add Diagram
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

export default DiagramOverviewTable;
