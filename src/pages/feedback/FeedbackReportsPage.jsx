/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import PageContainer from "../../components/shared/PageContainer";
import SectionCard from "../../components/shared/SectionCard";
import ChartCard from "../../components/shared/ChartCard";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

import FeedbackMetrics from "../../components/feedbackReports/FeedbackMetrics";
import ReportTypeDistributionChart from "../../components/feedbackReports/ReportTypeDistributionChart";
import MonthlyReportsTrendChart from "../../components/feedbackReports/MonthlyReportsTrendChart";
import ReportsOverviewTable from "../../components/feedbackReports/ReportsOverviewTable";

import { approveReport, rejectReport, deleteCarDiagramForReport } from "../../api/FeedbackReports/FeedbackReports.helper";
import { subscribeFeedbackReports } from "../../api/reports/reportsHelper";
import { REPORT_RANGE_OPTIONS, buildMonthlyReportsTrend, toDateSafe } from "../../lib/dashboard/aggregateDashboard";

const RANGE_OPTIONS = REPORT_RANGE_OPTIONS;

const TYPE_GENERAL = "General Feedback";
const TYPE_MISSING = "Missing Car";
const TYPE_INCORRECT = "Incorrect Location";

const rangeStartFromKey = (range, now = new Date()) => {
  if (range === "thisMonth") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "last3Months") return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (range === "thisYear") return new Date(now.getFullYear(), 0, 1);
  return null;
};

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const pctDelta = (current, prev) => {
  if (!prev) return current ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
};

export default function FeedbackReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("thisMonth");

  const [confirmState, setConfirmState] = useState({
    open: false,
    type: null,
    report: null,
  });

  const openConfirm = (type, report) => setConfirmState({ open: true, type, report });
  const closeConfirm = () => setConfirmState({ open: false, type: null, report: null });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeFeedbackReports(
      { limit: 500 }, // keep realtime scalable + avoid heavy reads
      (rows) => {
        setReports(rows || []);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const now = new Date();
  const rangeStart = useMemo(() => rangeStartFromKey(range, now), [range, now]);

  const filteredByRange = useMemo(
    () =>
      reports.filter((r) => {
        const d = toDateSafe(r.createdAt) || toDateSafe(r.updatedAt);
        if (!rangeStart) return true;
        return d ? d >= rangeStart : false;
      }),
    [reports, rangeStart]
  );

  // existing 4 cards (keep)
  const metrics = useMemo(() => {
    const currentMonthKey = monthKey(now);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = monthKey(prevMonthDate);

    const curMonth = reports.filter((r) => {
      const d = toDateSafe(r.createdAt) || toDateSafe(r.updatedAt);
      return d ? monthKey(d) === currentMonthKey : false;
    });

    const prevMonth = reports.filter((r) => {
      const d = toDateSafe(r.createdAt) || toDateSafe(r.updatedAt);
      return d ? monthKey(d) === prevMonthKey : false;
    });

    const curPending = curMonth.filter((r) => r.status === "pending").length;
    const prevPending = prevMonth.filter((r) => r.status === "pending").length;

    const curApproved = curMonth.filter((r) => r.status === "approved").length;
    const prevApproved = prevMonth.filter((r) => r.status === "approved").length;

    const curRejected = curMonth.filter((r) => r.status === "rejected").length;
    const prevRejected = prevMonth.filter((r) => r.status === "rejected").length;

    return [
      {
        id: "totalReports",
        title: "Total Reports",
        value: String(reports.length),
        deltaLabel: `${pctDelta(curMonth.length, prevMonth.length)}% vs Last Month`,
        deltaType: curMonth.length >= prevMonth.length ? "up" : "down",
      },
      {
        id: "pendingReviews",
        title: "Pending Reviews",
        value: String(reports.filter((r) => r.status === "pending").length),
        deltaLabel: `${pctDelta(curPending, prevPending)}% vs Last Month`,
        deltaType: curPending >= prevPending ? "up" : "down",
      },
      {
        id: "approvedUpdates",
        title: "Approved Updates",
        value: String(reports.filter((r) => r.status === "approved").length),
        deltaLabel: `${pctDelta(curApproved, prevApproved)}% vs Last Month`,
        deltaType: curApproved >= prevApproved ? "up" : "down",
      },
      {
        id: "rejectedReports",
        title: "Rejected Reports",
        value: String(reports.filter((r) => r.status === "rejected").length),
        deltaLabel: `${pctDelta(curRejected, prevRejected)}% vs Last Month`,
        deltaType: curRejected >= prevRejected ? "up" : "down",
      },
    ];
  }, [reports, now]);

  // ✅ NEW: 3 cards for "New feedbacks" by type (pending)
  const newByTypeMetrics = useMemo(() => {
    const currentMonthKey = monthKey(now);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = monthKey(prevMonthDate);

    const curMonth = reports.filter((r) => {
      const d = toDateSafe(r.createdAt) || toDateSafe(r.updatedAt);
      return d ? monthKey(d) === currentMonthKey : false;
    });

    const prevMonth = reports.filter((r) => {
      const d = toDateSafe(r.createdAt) || toDateSafe(r.updatedAt);
      return d ? monthKey(d) === prevMonthKey : false;
    });

    const build = (type, title, id) => {
      const cur = curMonth.filter((r) => r.status === "pending" && r.type === type).length;
      const prev = prevMonth.filter((r) => r.status === "pending" && r.type === type).length;

      return {
        id,
        title,
        value: String(cur),
        deltaLabel: `${pctDelta(cur, prev)}% vs Last Month`,
        deltaType: cur >= prev ? "up" : "down",
        helperText: "Pending",
      };
    };

    return [
      build(TYPE_GENERAL, "New General Feedback", "new_general"),
      build(TYPE_MISSING, "New Missing Car", "new_missing"),
      build(TYPE_INCORRECT, "New Incorrect Location", "new_incorrect"),
    ];
  }, [reports, now]);

  const typeDistribution = useMemo(() => {
    const counts = new Map();
    filteredByRange.forEach((r) => {
      const key = r.type || "Unknown";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredByRange]);

  const monthlyTrend = useMemo(() => buildMonthlyReportsTrend(reports, range), [reports, range]);

  const confirmConfig = useMemo(() => {
    const { type } = confirmState;
    if (!type) return null;

    if (type === "approve") {
      return {
        title: "Approve Report",
        description:
          "Approve this report? This marks it as approved and reduces pending counts. Apply data fixes in Car Database / Diagram Management if needed.",
        confirmLabel: "Approve",
        cancelLabel: "Cancel",
        variant: "primary",
      };
    }

    if (type === "reject") {
      return {
        title: "Reject Report",
        description: "Reject this report? The suggested update will not be applied and it will be marked as rejected.",
        confirmLabel: "Reject",
        cancelLabel: "Cancel",
        variant: "danger",
      };
    }

    return {
      title: "Delete Diagram",
      description:
        "This will remove the uploaded car diagram and its battery marker. The car entry will remain, but the image will disappear until a new diagram is uploaded.",
      confirmLabel: "Delete Diagram",
      cancelLabel: "Cancel",
      variant: "danger",
    };
  }, [confirmState]);

  const handleConfirmAction = async () => {
    const { type, report } = confirmState;
    if (!report) return;

    try {
      if (type === "approve") {
        await approveReport(report.id);
      } else if (type === "reject") {
        await rejectReport(report.id);
      } else if (type === "delete-diagram") {
        await deleteCarDiagramForReport({ carId: report.carId });
      }

      // Snapshot will update UI automatically
      closeConfirm();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <PageContainer>
        {/* Existing metrics */}
        <FeedbackMetrics metrics={metrics} />

        {/* ✅ NEW 3 BOXES */}
        <div className="mt-4">
          <FeedbackMetrics metrics={newByTypeMetrics} />
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Report Type Distribution"
            rightSlot={
              <select
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                {RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            }
          >
            <ReportTypeDistributionChart data={typeDistribution} loading={loading} />
          </ChartCard>

          <ChartCard
            title="Monthly Reports Trend"
            rightSlot={
              <select
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                {RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            }
          >
            <MonthlyReportsTrendChart data={monthlyTrend} loading={loading} />
          </ChartCard>
        </div>

        <SectionCard title="Overview" className="mt-5">
          <ReportsOverviewTable
            reports={reports}
            loading={loading}
            onApprove={(r) => openConfirm("approve", r)}
            onReject={(r) => openConfirm("reject", r)}
            onDeleteDiagram={(r) => openConfirm("delete-diagram", r)}
          />
        </SectionCard>
      </PageContainer>

      {confirmConfig && (
        <ConfirmDialog
          isOpen={confirmState.open}
          onClose={closeConfirm}
          onConfirm={handleConfirmAction}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmLabel={confirmConfig.confirmLabel}
          cancelLabel={confirmConfig.cancelLabel}
          variant={confirmConfig.variant}
        />
      )}
    </>
  );
}
