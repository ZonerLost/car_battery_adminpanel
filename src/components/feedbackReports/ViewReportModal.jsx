import Modal from "../shared/Modal";
import StatusPill from "../shared/StatusPill";
import Button from "../shared/Button";
import { toDateSafe } from "../../lib/dashboard/aggregateDashboard";

const formatCar = (report) => {
  const parts = [report.make, report.model].filter(Boolean);
  const yf = Number(report.yearFrom);
  const yt = Number(report.yearTo);

  if (Number.isFinite(yf) && Number.isFinite(yt)) {
    parts.push(yf === yt ? String(yf) : `${yf}-${yt}`);
  } else if (Number.isFinite(yf)) {
    parts.push(String(yf));
  } else if (Number.isFinite(yt)) {
    parts.push(String(yt));
  }

  return parts.join(" ").trim() || "—";
};

const formatDate = (value) => {
  const d = toDateSafe(value);
  return d ? d.toLocaleString() : "—";
};

const statusToPill = (status) => {
  if (status === "approved") return { status: "success", label: "Approved" };
  if (status === "rejected") return { status: "missing", label: "Rejected" };
  return { status: "pending", label: "Pending" };
};

const ViewReportModal = ({ isOpen, onClose, report, onApprove, onReject }) => {
  if (!report) return null;

  const pill = statusToPill(report.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="View Report" size="md">
      <div className="text-sm text-slate-700 space-y-4">
        <div className="rounded-lg border border-slate-200 p-4 bg-white space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-slate-500">Report ID</div>
            <div className="font-medium">{report.code || report.id}</div>

            <div className="text-slate-500">Type</div>
            <div className="font-medium">{report.type || "—"}</div>

            <div className="text-slate-500">Car (Make/Model/Year)</div>
            <div className="font-medium">{formatCar(report)}</div>

            <div className="text-slate-500">Submitted By</div>
            <div className="font-medium">{report.submittedByEmail || report.submittedEmail || "—"}</div>

            <div className="text-slate-500">Date</div>
            <div className="font-medium">{formatDate(report.createdAt || report.updatedAt)}</div>

            <div className="text-slate-500">Status</div>
            <div>
              <StatusPill status={pill.status} label={pill.label} />
            </div>

            <div className="text-slate-500">Car ID</div>
            <div className="font-medium">{report.carId || "—"}</div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-slate-500 mb-1">Comment</div>
            <div className="font-medium whitespace-pre-wrap">{report.message || "—"}</div>
          </div>

          {report.suggestedMarker && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-slate-500 mb-1">Suggested Marker</div>
              <div className="font-medium">
                x: {report.suggestedMarker.xPct ?? "—"}%, y: {report.suggestedMarker.yPct ?? "—"}%
              </div>
            </div>
          )}

          {report.attachmentUrl && (
            <div className="pt-2 border-t border-slate-100">
              <a
                href={report.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#E53935] text-sm font-semibold"
              >
                View Attachment
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            size="md"
            variant="primary"
            className="flex-1"
            onClick={() => {
              onApprove?.(report);
              onClose?.();
            }}
          >
            Approve Report
          </Button>

          <Button
            size="md"
            variant="danger"
            className="flex-1"
            onClick={() => {
              onReject?.(report);
              onClose?.();
            }}
          >
            Reject Report
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewReportModal;
