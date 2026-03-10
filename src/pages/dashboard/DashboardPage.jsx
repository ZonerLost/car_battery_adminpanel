import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageContainer from "../../components/shared/PageContainer";
import DashboardMetrics from "../../components/dashboard/DashboardMetrics";
import SectionCard from "../../components/shared/SectionCard";
import ChartCard from "../../components/shared/ChartCard";
import CarCoverageChart from "../../components/dashboard/CarCoverageChart";
import MonthlyReportsChart from "../../components/dashboard/MonthlyReportsChart";
import OverviewTable from "../../components/dashboard/OverviewTable";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import useDashboardData from "../../hooks/useDashboardData";
import {
  DASHBOARD_RANGE_OPTIONS,
  REPORT_RANGE_OPTIONS,
  buildCoverageByType,
  buildDashboardMetrics,
  buildMonthlyReportsTrend,
  buildOverviewRows,
} from "../../lib/dashboard/aggregateDashboard";
import { deleteCarEntry } from "../../api/shared/carEntries.helper";
import useAsyncAction from "../../hooks/useAsyncAction";
import { getErrorMessage } from "../../utils/errorMessage";

const RangeSelect = ({ value, onChange, options }) => (
  <select
    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E53935]"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

const DashboardPage = () => {
  const { cars, reports, counts, loading, refresh } = useDashboardData();

  const [coverageRange, setCoverageRange] = useState("thisMonth");
  const [reportsRange, setReportsRange] = useState("thisYear");

  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [confirmError, setConfirmError] = useState("");
  const { run, isPending } = useAsyncAction();

  const metrics = useMemo(() => buildDashboardMetrics(cars, reports, counts), [cars, reports, counts]);
  const coverageData = useMemo(() => buildCoverageByType(cars, coverageRange), [cars, coverageRange]);
  const reportsTrend = useMemo(() => buildMonthlyReportsTrend(reports, reportsRange), [reports, reportsRange]);
  const tableRows = useMemo(() => buildOverviewRows(cars), [cars]);
  const confirmActionKey = confirmState.row?.id ? `dashboard-delete:${confirmState.row.id}` : null;
  const pendingDeleteId = isPending(confirmActionKey) ? confirmState.row?.id : null;

  const openDeleteConfirm = (row) => {
    setConfirmError("");
    setConfirmState({ open: true, row });
  };
  const closeDeleteConfirm = () => {
    if (isPending(confirmActionKey)) return;
    setConfirmError("");
    setConfirmState({ open: false, row: null });
  };

  const handleDeleteRow = async () => {
    if (!confirmState.row?.id) return;

    const result = await run(confirmActionKey, async () => {
      await deleteCarEntry(confirmState.row.id);
    });

    if (result.skipped) return;

    if (!result.ok) {
      const message = getErrorMessage(result.error, "Failed to delete car");
      setConfirmError(message);
      toast.error(message, { id: "dashboard-delete-car" });
      return;
    }

    closeDeleteConfirm();
    toast.success("Car deleted successfully", { id: "dashboard-delete-car" });
    await refresh();
  };

  return (
    <>
      <PageContainer>
        <DashboardMetrics metrics={metrics} />

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Car Coverage By Type"
            rightSlot={<RangeSelect value={coverageRange} onChange={setCoverageRange} options={DASHBOARD_RANGE_OPTIONS} />}
          >
            <CarCoverageChart data={coverageData} loading={loading} />
          </ChartCard>

          <ChartCard
            title="Monthly Reports Trend"
            rightSlot={<RangeSelect value={reportsRange} onChange={setReportsRange} options={REPORT_RANGE_OPTIONS} />}
          >
            <MonthlyReportsChart data={reportsTrend} loading={loading} />
          </ChartCard>
        </div>

        <SectionCard title="Overview" className="mt-5">
          <OverviewTable
            rows={tableRows}
            loading={loading}
            onDeleteRow={openDeleteConfirm}
            pendingDeleteId={pendingDeleteId}
          />
        </SectionCard>
      </PageContainer>

      <ConfirmDialog
        isOpen={confirmState.open}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteRow}
        title="Delete Record"
        description="Delete this car record from the database? This also removes any linked diagrams and markers."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={isPending(confirmActionKey)}
        loadingLabel="Deleting..."
        errorText={confirmError}
      />
    </>
  );
};

export default DashboardPage;
