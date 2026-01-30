import { useMemo, useState } from "react";
import TableToolbar from "../shared/TableToolbar";
import DataTable from "../shared/DataTable";
import Pagination from "../shared/Pagination";
import IconButton from "../shared/IconButton";
import StatusPill from "../shared/StatusPill";
import Button from "../shared/Button";
import { FiTrash2, FiEye } from "react-icons/fi";
import ViewReportModal from "./ViewReportModal";
import { toDateSafe } from "../../lib/dashboard/aggregateDashboard";

const formatCar = (report) => {
  const parts = [report.make, report.model].filter(Boolean);

  const yf = Number.isFinite(report.yearFrom) ? report.yearFrom : Number(report.yearFrom);
  const yt = Number.isFinite(report.yearTo) ? report.yearTo : Number(report.yearTo);

  if (Number.isFinite(yf) && Number.isFinite(yt)) {
    parts.push(yf === yt ? String(yf) : `${yf}-${yt}`);
  } else if (Number.isFinite(yf)) {
    parts.push(String(yf));
  } else if (Number.isFinite(yt)) {
    parts.push(String(yt));
  }

  return parts.join(" ").trim() || "—";
};

const formatDate = (value) => {
  const d = toDateSafe(value);
  return d ? d.toLocaleDateString() : "—";
};

const ReportsOverviewTable = ({ reports = [], loading = false, onApprove, onReject, onDeleteDiagram }) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const searchText = `${r.code || r.id} ${r.type || ""} ${formatCar(r)} ${r.submittedByDisplay || r.submittedByEmail || ""}`.toLowerCase();
      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesType = typeFilter === "all" ? true : r.type === typeFilter;
      const matchesStatus = statusFilter === "all" ? true : r.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [reports, search, typeFilter, statusFilter]);

  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  const renderStatusAction = (row) => {
    if (row.status === "approved") {
      return <StatusPill status="success" label="Approved" />;
    }
    if (row.status === "rejected") {
      return <StatusPill status="missing" label="Rejected" />;
    }

    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="primary"
          className="px-3 py-1 text-[11px] rounded-full whitespace-nowrap"
          onClick={() => onApprove?.(row)}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="danger"
          className="px-3 py-1 text-[11px] rounded-full whitespace-nowrap"
          onClick={() => onReject?.(row)}
        >
          Reject
        </Button>
      </div>
    );
  };

  const columns = [
    {
      key: "id",
      label: "Report ID",
      render: (row) => row.code || row.id,
    },
    { key: "type", label: "Type" },
    {
      key: "car",
      label: "Car (Make/Model/Year)",
      render: (row) => formatCar(row),
    },
    {
      key: "submittedBy",
      label: "Submitted By",
      render: (row) => row.submittedByDisplay || row.submittedByName || row.submittedByEmail || row.submittedEmail || "—",
    },
    {
      key: "date",
      label: "Date",
      render: (row) => formatDate(row.createdAt || row.updatedAt),
    },
    {
      key: "status",
      label: "Status",
      render: renderStatusAction,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedReport(row);
              setViewOpen(true);
            }}
            aria-label={`View ${row.id}`}
          >
            <FiEye className="text-[13px]" />
          </IconButton>

          {onDeleteDiagram && (
            <IconButton size="sm" variant="danger" onClick={() => onDeleteDiagram(row)}>
              <FiTrash2 className="text-[13px]" />
            </IconButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <TableToolbar
        searchPlaceholder="Search by Make, Model, or Email"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        leftContent={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Type</option>
              <option value="Incorrect Location">Incorrect Location</option>
              <option value="Missing Car">Missing Car</option>
              <option value="General Feedback">General Feedback</option>
            </select>

            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E53935]"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        }
        rightContent={null}
      />

      <div className="mt-1 overflow-x-auto">
        <DataTable columns={columns} data={pageRows} loading={loading} emptyMessage="No reports found" />
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

      <ViewReportModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        report={selectedReport}
        onApprove={(r) => onApprove?.(r)}
        onReject={(r) => onReject?.(r)}
      />
    </div>
  );
};

export default ReportsOverviewTable;
