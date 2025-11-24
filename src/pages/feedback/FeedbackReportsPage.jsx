import React, { useState } from "react";
import PageContainer from "../../components/shared/PageContainer";
import PageHeader from "../../components/shared/PageHeader";
import SectionCard from "../../components/shared/SectionCard";
import ChartCard from "../../components/shared/ChartCard";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

import FeedbackMetrics from "../../components/feedbackReports/FeedbackMetrics";
import ReportTypeDistributionChart from "../../components/feedbackReports/ReportTypeDistributionChart";
import MonthlyReportsTrendChart from "../../components/feedbackReports/MonthlyReportsTrendChart";
import ReportsOverviewTable from "../../components/feedbackReports/ReportsOverviewTable";

// dummy data – swap with API later
const INITIAL_REPORTS = [
  {
    id: "RPT-1023",
    type: "Incorrect Location",
    car: "Toyota Corolla 2015",
    submittedBy: "ali.hassan@gmail.com",
    date: "Aug 5",
    status: "pending", // pending | approved | rejected
  },
  {
    id: "RPT-1024",
    type: "Missing Car",
    car: "Honda Civic 2018",
    submittedBy: "jane.doe@example.com",
    date: "Aug 6",
    status: "pending",
  },
  {
    id: "RPT-1025",
    type: "Incorrect Location",
    car: "Ford Fiesta 2020",
    submittedBy: "john.smith@example.com",
    date: "Aug 7",
    status: "rejected",
  },
  {
    id: "RPT-1026",
    type: "Missing Car",
    car: "Chevrolet Malibu 2019",
    submittedBy: "emily.johnson@example.com",
    date: "Aug 7",
    status: "pending",
  },
  {
    id: "RPT-1027",
    type: "General Feedback",
    car: "Nissan Altima 2018",
    submittedBy: "mike.brown@example.com",
    date: "Aug 11",
    status: "approved",
  },
  {
    id: "RPT-1028",
    type: "General Feedback",
    car: "Subaru Outback 2016",
    submittedBy: "susan.lee@example.com",
    date: "Aug 12",
    status: "pending",
  },
];

const METRICS = [
  {
    id: "totalReports",
    title: "Total Reports",
    value: "340",
    deltaLabel: "10% vs Last Month",
    deltaType: "up",
  },
  {
    id: "pendingReviews",
    title: "Pending Reviews",
    value: "85",
    deltaLabel: "10% vs Last Month",
    deltaType: "up",
  },
  {
    id: "approvedUpdates",
    title: "Approved Updates",
    value: "210",
    deltaLabel: "32% vs Last Month",
    deltaType: "up",
  },
  {
    id: "rejectedReports",
    title: "Rejected Reports",
    value: "45",
    deltaLabel: "20% vs Last Month",
    deltaType: "up",
  },
];

const FeedbackReportsPage = () => {
  const [reports, setReports] = useState(INITIAL_REPORTS);

  const [confirmState, setConfirmState] = useState({
    open: false,
    type: null, // "approve" | "reject" | "delete-diagram"
    report: null,
  });

  const openConfirm = (type, report) =>
    setConfirmState({ open: true, type, report });

  const closeConfirm = () =>
    setConfirmState({ open: false, type: null, report: null });

  const handleConfirmAction = () => {
    const { type, report } = confirmState;
    if (!report) return;

    if (type === "approve") {
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id ? { ...r, status: "approved" } : r
        )
      );
    } else if (type === "reject") {
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id ? { ...r, status: "rejected" } : r
        )
      );
    } else if (type === "delete-diagram") {
      // In real app you'd call API to delete diagram here
      // For now we just log or leave data unchanged
      console.log("Delete diagram for report", report.id);
    }

    closeConfirm();
  };

  const confirmConfig = (() => {
    const { type } = confirmState;
    if (!type) return null;

    if (type === "approve") {
      return {
        title: "Approve Report",
        description:
          "Are you sure you want to approve this report? Approving will confirm the user’s correction and update the car’s record in the database.",
        confirmLabel: "Approve",
        cancelLabel: "Cancel",
        variant: "primary", // will use normal primary button
      };
    }
    if (type === "reject") {
      return {
        title: "Reject Report",
        description:
          "Are you sure you want to reject this report? The suggested update will not be applied to the database.",
        confirmLabel: "Reject Report",
        cancelLabel: "Cancel",
        variant: "danger",
      };
    }
    return {
      title: "Delete Diagram",
      description:
        "This will remove the uploaded car diagram and its assigned battery marker. The car entry will remain in the database, but it will no longer display an image in the app until a new diagram is added.",
      confirmLabel: "Delete Diagram",
      cancelLabel: "Cancel",
      variant: "danger",
    };
  })();

  return (
    <>
      <PageContainer>
        {/* <PageHeader title="Feedback & Report" /> */}

        {/* Metrics */}
        <FeedbackMetrics metrics={METRICS} />

        {/* Charts row */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Report Type Distribution"
            rightSlot={
              <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
                This Month
              </button>
            }
          >
            <ReportTypeDistributionChart />
          </ChartCard>

          <ChartCard
            title="Monthly Reports Trend"
            rightSlot={
              <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
                This Month
              </button>
            }
          >
            <MonthlyReportsTrendChart />
          </ChartCard>
        </div>

        {/* Overview table */}
        <SectionCard title="Overview" className="mt-5">
          <ReportsOverviewTable
            reports={reports}
            onApprove={(report) => openConfirm("approve", report)}
            onReject={(report) => openConfirm("reject", report)}
            onDeleteDiagram={(report) => openConfirm("delete-diagram", report)}
          />
        </SectionCard>
      </PageContainer>

      {/* Approve / Reject / Delete Diagram dialogs */}
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
};

export default FeedbackReportsPage;
