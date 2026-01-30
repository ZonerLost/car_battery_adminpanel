import { useMemo, useState } from "react";
import TableToolbar from "../shared/TableToolbar";
import DataTable from "../shared/DataTable";
import Pagination from "../shared/Pagination";
import StatusPill from "../shared/StatusPill";
import IconButton from "../shared/IconButton";
import Button from "../shared/Button";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

const missingValue = "--";

const toDate = (value) => {
  if (value?.toDate?.()) return value.toDate();
  if (value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

const formatYearRange = (row) => {
  const yf = row.yearFrom ?? row.year;
  const yt = row.yearTo ?? row.yearFrom ?? row.year;
  if (yf && yt) return `${yf}-${yt}`;
  if (yf) return yf;
  return missingValue;
};

const getDiagramStatus = (row) => row.diagramStatus || (row.diagramUrl ? "uploaded" : "missing");

const DiagramOverviewTable = ({
  diagrams,
  loading,
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
      const searchText = `${d.make} ${d.model} ${d.yearFrom || ""} ${d.yearTo || ""} ${d.location || ""}`
        .toLowerCase()
        .trim();
      const matchesSearch = searchText.includes(search.toLowerCase());

      const diagramStatus = getDiagramStatus(d);
      const matchesStatus = statusFilter === "all" ? true : diagramStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [diagrams, search, statusFilter]);

  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  const renderDiagramStatus = (row) => {
    const status = getDiagramStatus(row);
    if (status === "uploaded") return <StatusPill status="success" label="Uploaded" />;
    if (status === "pending") return <StatusPill status="pending" label="Pending" />;
    return <StatusPill status="missing" label="Missing" />;
  };

  const columns = [
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    { key: "year", label: "Year Range", render: formatYearRange },
    { key: "diagramStatus", label: "Diagram Status", render: renderDiagramStatus },
    {
      key: "lastUpdated",
      label: "Last Updated",
      render: (row) => {
        const d = toDate(row.updatedAt);
        return d ? d.toLocaleDateString() : missingValue;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <IconButton size="sm" onClick={() => onEditDiagram(row)}>
            <FiEdit2 className="text-[13px]" />
          </IconButton>

          <IconButton size="sm" variant="danger" onClick={() => onDeleteDiagram(row)}>
            <FiTrash2 className="text-[13px]" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <TableToolbar
        searchPlaceholder="Search by make/model/year/location"
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
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
              <option value="pending">Pending</option>
              <option value="missing">Missing</option>
            </select>
          </div>
        }
        rightContent={
          <Button size="sm" onClick={onAddDiagram}>
            Add Diagram
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

export default DiagramOverviewTable;
