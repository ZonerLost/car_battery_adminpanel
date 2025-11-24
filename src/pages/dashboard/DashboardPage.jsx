
import React, { useState } from "react";
import PageContainer from "../../components/shared/PageContainer";
import PageHeader from "../../components/shared/PageHeader";
import DashboardMetrics from "../../components/dashboard/DashboardMetrics";
import SectionCard from "../../components/shared/SectionCard";
import ChartCard from "../../components/shared/ChartCard";
import CarCoverageChart from "../../components/dashboard/CarCoverageChart";
import MonthlyReportsChart from "../../components/dashboard/MonthlyReportsChart";
import OverviewTable from "../../components/dashboard/OverviewTable";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

// Sample rows – same shape as before
const INITIAL_ROWS = [
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

const DashboardPage = () => {
  // metrics – unchanged
  const metrics = [
    {
      id: "cars",
      title: "Total Cars in Database",
      value: "2,450",
      deltaLabel: "10% vs Last Month",
      deltaType: "up",
    },
    {
      id: "diagrams",
      title: "Diagrams Uploaded",
      value: "2,100",
      deltaLabel: "32% vs Last Month",
      deltaType: "up",
    },
    {
      id: "markers",
      title: "Marking Mistakes",
      value: "130",
      deltaLabel: "20% vs Last Month",
      deltaType: "down",
    },
    {
      id: "pending",
      title: "Pending Reports",
      value: "85",
      deltaLabel: "20% vs Last Month",
      deltaType: "up",
    },
  ];

  // ---- table rows state ----
  const [rows, setRows] = useState(INITIAL_ROWS);

  // ---- delete confirm dialog state ----
  const [confirmState, setConfirmState] = useState({
    open: false,
    row: null,
  });

  const openDeleteConfirm = (row) =>
    setConfirmState({ open: true, row });

  const closeDeleteConfirm = () =>
    setConfirmState({ open: false, row: null });

  const handleDeleteRow = () => {
    if (!confirmState.row) return;
    setRows((prev) => prev.filter((r) => r.id !== confirmState.row.id));
    closeDeleteConfirm();
  };

  return (
    <>
      <PageContainer>
        {/* (Optional) use header if you want – was already imported */}
        {/* <PageHeader title="Dashboard" /> */}

        {/* Metrics row */}
        <DashboardMetrics metrics={metrics} />

        {/* Charts row */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Car Coverage By Type"
            rightSlot={
              <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
                This Month
              </button>
            }
          >
            <CarCoverageChart />
          </ChartCard>

          <ChartCard
            title="Monthly Reports Trend"
            rightSlot={
              <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
                This Year
              </button>
            }
          >
            <MonthlyReportsChart />
          </ChartCard>
        </div>

        {/* Overview table */}
        <SectionCard title="Overview" className="mt-5">
          <OverviewTable
            rows={rows}
            onDeleteRow={openDeleteConfirm}
            // you can also pass onEditRow if you want later
          />
        </SectionCard>
      </PageContainer>

      {/* Delete row confirm – same behavior as DiagramManagementPage */}
      <ConfirmDialog
        isOpen={confirmState.open}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteRow}
        title="Delete Record"
        description="Are you sure you want to delete this record from the dashboard overview? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </>
  );
};

export default DashboardPage;
