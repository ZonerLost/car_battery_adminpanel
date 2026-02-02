/* eslint-disable no-unused-vars */
import Modal from "../shared/Modal";
import StatusPill from "../shared/StatusPill";
import Button from "../shared/Button";
import { toDateSafe } from "../../lib/dashboard/aggregateDashboard";

const TYPE_GENERAL = "general feedback";
const TYPE_MISSING = "missing car";
const TYPE_INCORRECT = "incorrect location";

const safeText = (v) => String(v ?? "").trim();
const typeNorm = (t) => safeText(t).toLowerCase();

const formatDate = (value) => {
  const d = toDateSafe(value);
  return d ? d.toLocaleString() : "—";
};

const statusToPill = (status) => {
  if (status === "approved") return { status: "success", label: "Approved" };
  if (status === "rejected") return { status: "missing", label: "Rejected" };
  return { status: "pending", label: "Pending" };
};

const getSubmittedBy = (report) =>
  safeText(
    report.submittedByDisplay ||
      report.submittedByName ||
      report.submittedByEmail ||
      report.submittedBy ||
      report.email ||
      report.submittedEmail
  ) || "—";

const formatCar = (report) => {
  const carStr = safeText(report.car);
  if (carStr) return carStr;

  const parts = [report.make, report.model].filter(Boolean);
  const year = Number(report.year ?? report.yearFrom ?? report.yearTo);

  if (Number.isFinite(year)) parts.push(String(year));

  return parts.join(" ").trim() || "—";
};

const getCarIdDisplay = (report) => {
  //  This fixes your “Car ID —” issue.
  // If real carId is missing, show carKey fallback (make-model-year).
  return (
    safeText(report.carId) ||
    safeText(report.carKey) ||
    safeText(report.car) ||
    "—"
  );
};

const getAttachment = (report) => {
  const url = report.attachmentUrl || null;
  if (!url) return null;

  const name =
    report.attachmentName ||
    safeText(url.split("?")[0]?.split("/").pop()) ||
    "attachment";

  const lower = name.toLowerCase();
  const isImage = ["png", "jpg", "jpeg", "webp", "gif"].some((ext) => lower.endsWith(`.${ext}`));

  return { url, name, isImage };
};

const Row = ({ label, value }) => (
  <>
    <div className="text-slate-500">{label}</div>
    <div className="font-medium wrap-break-word">{value ?? "—"}</div>
  </>
);

const ViewReportModal = ({ isOpen, onClose, report, onApprove, onReject }) => {
  if (!report) return null;

  const pill = statusToPill(report.status);
  const submittedBy = getSubmittedBy(report);

  const isGeneral = typeNorm(report.type) === TYPE_GENERAL;
  const isMissing = typeNorm(report.type) === TYPE_MISSING;
  const isIncorrect = typeNorm(report.type) === TYPE_INCORRECT;

  const attachment = getAttachment(report);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="View Report" size="md">
      <div className="text-sm text-slate-700 space-y-4">
        <div className="rounded-lg border border-slate-200 p-4 bg-white space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Report ID" value={report.code || report.id} />
            <Row label="Type" value={report.type || "—"} />

            <Row label="Submitted By" value={submittedBy} />
            <Row label="Date" value={formatDate(report.createdAt || report.updatedAt)} />

            <div className="text-slate-500">Status</div>
            <div>
              <StatusPill status={pill.status} label={pill.label} />
            </div>

            {/*  General Feedback: NO car fields (match mobile UI) */}
            {isGeneral ? (
              <>
                <Row label="Email" value={report.email || submittedBy} />
                <Row label="Category" value={report.category || "—"} />
              </>
            ) : (
              <>
                {/* Missing Car + Incorrect Location: show car + car id */}
                <Row label="Car (Make/Model/Year)" value={formatCar(report)} />
                {/* <Row label="Car ID" value={getCarIdDisplay(report)} /> */}

                {isIncorrect && (
                  <>
                    <Row label="Reported Area" value={report.reportedArea || "—"} />
                    <Row label="Correct Area" value={report.correctArea || "—"} />
                  </>
                )}
              </>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-slate-500 mb-1">Message</div>
            <div className="font-medium whitespace-pre-wrap">{report.message || "—"}</div>
          </div>

          {attachment && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-slate-500">Attachment</div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-700 truncate">{attachment.name}</div>

                <div className="flex gap-2">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#E53935] text-xs font-semibold"
                  >
                    Open
                  </a>
                  <a href={attachment.url} download className="text-[#E53935] text-xs font-semibold">
                    Download
                  </a>
                </div>
              </div>

              {attachment.isImage && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-full max-h-52 object-contain bg-slate-50"
                    loading="lazy"
                  />
                </div>
              )}
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
