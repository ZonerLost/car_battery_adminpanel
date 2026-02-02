import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import Topbar from "../components/ui/Topbar";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden flex bg-slate-50 relative">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
