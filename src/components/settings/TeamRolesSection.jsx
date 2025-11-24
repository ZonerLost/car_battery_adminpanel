import React, { useMemo, useState } from "react";
import TableToolbar from "../shared/TableToolbar";
import DataTable from "../shared/DataTable";
import Pagination from "../shared/Pagination";
import StatusPill from "../shared/StatusPill";
import IconButton from "../shared/IconButton";
import Button from "../shared/Button";
import { FiEdit2, FiTrash2, FiChevronDown } from "react-icons/fi";

const TeamRolesSection = ({ members, onAddUserClick, onDeactivateClick }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch = `${m.name} ${m.email}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, search, statusFilter]);

  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "lastActive", label: "Last Active" },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const isActive = row.status === "active";
        return (
          <button type="button" className="inline-flex items-center gap-1">
            <StatusPill
              status={isActive ? "active" : "missing"}
              label={isActive ? "Active" : "Suspend"}
            />
            <FiChevronDown className="text-[11px] text-slate-500" />
          </button>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <IconButton size="sm">
            <FiEdit2 className="text-[13px]" />
          </IconButton>
          <IconButton
            size="sm"
            variant="danger"
            onClick={() => onDeactivateClick(row)}
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
              <option value="suspended">Suspended</option>
            </select>
          </div>
        }
        rightContent={
          <Button size="sm" onClick={onAddUserClick}>
            Add User
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

export default TeamRolesSection;
