import React, { useMemo, useState } from "react";
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
  const { cars, reports, loading, refresh } = useDashboardData();

  const [coverageRange, setCoverageRange] = useState("thisMonth");
  const [reportsRange, setReportsRange] = useState("thisYear");

  const [confirmState, setConfirmState] = useState({ open: false, row: null });

  const metrics = useMemo(() => buildDashboardMetrics(cars, reports), [cars, reports]);
  const coverageData = useMemo(() => buildCoverageByType(cars, coverageRange), [cars, coverageRange]);
  const reportsTrend = useMemo(() => buildMonthlyReportsTrend(reports, reportsRange), [reports, reportsRange]);
  const tableRows = useMemo(() => buildOverviewRows(cars), [cars]);

  const openDeleteConfirm = (row) => setConfirmState({ open: true, row });
  const closeDeleteConfirm = () => setConfirmState({ open: false, row: null });

  const handleDeleteRow = async () => {
    if (!confirmState.row?.id) return;
    try {
      await deleteCarEntry(confirmState.row.id);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      closeDeleteConfirm();
    }
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
          <OverviewTable rows={tableRows} loading={loading} onDeleteRow={openDeleteConfirm} />
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
      />
    </>
  );
};

export default DashboardPage;
