import React, { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiDatabase,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../shared/ConfirmDialog";

const navItems = [
  { label: "Dashboard", icon: FiGrid, to: "/" },
  { label: "Car Database", icon: FiDatabase, to: "/car-database" },
  { label: "Feedback & Reports", icon: FiFileText, to: "/feedback-reports" },
  { label: "Diagram Management", icon: FiBarChart2, to: "/diagram-management" },
  { label: "Settings", icon: FiSettings, to: "/settings" },
];

function humanizeFromEmail(email) {
  if (!email) return "Admin";
  const local = String(email).split("@")[0] || "admin";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Admin";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getAvatarLetter(name, email) {
  const source = (name || email || "A").trim();
  return source.charAt(0).toUpperCase();
}

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const profile = useMemo(() => {
    const email = user?.email || "";
    const name = user?.displayName || humanizeFromEmail(email);
    const avatarLetter = getAvatarLetter(name, email);
    return { name, email, avatarLetter };
  }, [user]);

  const handleConfirmLogout = async () => {
    try {
      await logout(); // Firebase signOut
      navigate("/login", { replace: true });
    } finally {
      setShowLogoutConfirm(false);
      onClose?.();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`
          fixed z-40 inset-y-0 left-0
          w-64 bg-[#E53935] text-white h-screen overflow-y-auto
          transform transition-transform duration-200
          md:sticky md:top-0 md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          flex flex-col
        `}
      >
        {/* Top profile card */}
        <div className="p-3">
          <div className="bg-[#F8554A] rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center text-sm font-semibold text-[#E53935]">
              {profile.avatarLetter}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold leading-tight truncate">
                {loading ? "Loading..." : profile.name}
              </span>
              <span className="text-[10px] text-white/80 leading-tight truncate">
                {loading ? "" : profile.email || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="mt-3 flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  transition-colors
                  ${
                    isActive
                      ? "bg-white text-[#E53935] font-semibold"
                      : "text-white/90 hover:bg-white/10"
                  }
                `
                }
                onClick={onClose}
              >
                <Icon className="text-lg shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout at bottom */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="mt-auto mb-4 mx-3 flex items-center gap-3 text-xs text-white/90 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
        >
          <FiLogOut className="text-lg" />
          <span>Logout</span>
        </button>
      </aside>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Logout"
        description="Are you sure you want to logout? You will need to sign in again to access the dashboard."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        variant="danger"
      />
    </>
  );
};

export default Sidebar;