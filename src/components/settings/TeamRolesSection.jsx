import { useMemo, useState } from "react";
import TableToolbar from "../shared/TableToolbar";
import DataTable from "../shared/DataTable";
import Pagination from "../shared/Pagination";
import StatusPill from "../shared/StatusPill";
import Button from "../shared/Button";
import IconButton from "../shared/IconButton";
import PopoverMenuPortal from "../shared/PopoverMenuPortal";
import { FiMoreVertical } from "react-icons/fi";

const TeamRolesSection = ({
  members,
  loading = false,
  disabled = false,
  onAddUserClick,
  onDeactivateClick,
  onActivateClick,
  onEditClick,
  onRemoveClick,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [menuState, setMenuState] = useState({ uid: null, anchorEl: null, row: null });

  const closeMenu = () => setMenuState({ uid: null, anchorEl: null, row: null });

  const filtered = useMemo(() => {
    return (members || []).filter((m) => {
      const matchesSearch = `${m.name} ${m.email}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, search, statusFilter]);

  const startIndex = (page - 1) * pageSize;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "lastActive", label: "Last Active" },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const isActive = row.status === "active";
        return (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (isActive) onDeactivateClick?.(row);
              else onActivateClick?.(row);
            }}
            className="inline-flex items-center gap-1 disabled:opacity-60"
            title={isActive ? "Click to suspend" : "Click to activate"}
          >
            <StatusPill
              status={isActive ? "active" : "missing"}
              label={isActive ? "Active" : "Suspend"}
            />
          </button>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="relative">
          <IconButton
            size="sm"
            onClick={(e) =>
              setMenuState((prev) =>
                prev.uid === row.uid
                  ? { uid: null, anchorEl: null, row: null }
                  : { uid: row.uid, anchorEl: e.currentTarget, row }
              )
            }
          >
            <FiMoreVertical className="text-[14px]" />
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
              disabled={disabled}
            >
              <option value="all">Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        }
        rightContent={
          <Button size="sm" onClick={onAddUserClick} disabled={disabled}>
            Add User
          </Button>
        }
      />

      <div className="mt-1 overflow-x-auto">
        {loading ? (
          <div className="p-4 text-xs text-slate-500">Loading team members...</div>
        ) : (
          <DataTable columns={columns} data={pageRows} />
        )}
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

      <PopoverMenuPortal
        open={!!menuState.uid}
        anchorEl={menuState.anchorEl}
        onClose={closeMenu}
        align="right"
      >
        <div className="w-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50"
            onClick={() => {
              if (menuState.row) onEditClick?.(menuState.row);
              closeMenu();
            }}
            disabled={disabled}
          >
            Edit User
          </button>
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-slate-50"
            onClick={() => {
              if (menuState.row) onRemoveClick?.(menuState.row);
              closeMenu();
            }}
            disabled={disabled}
          >
            Remove User
          </button>
        </div>
      </PopoverMenuPortal>
    </div>
  );
};

export default TeamRolesSection;
