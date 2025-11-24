import React from "react";
import Modal from "../shared/Modal";
import StatusPill from "../shared/StatusPill";
import Button from "../shared/Button";

const ViewReportModal = ({ isOpen, onClose, report, onApprove, onReject }) => {
  if (!report) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="View Report" size="md">
      <div className="text-sm text-slate-700">
        <div className="mb-4 rounded-lg border border-slate-200 p-4 bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-slate-500">Report ID</div>
            <div className="font-medium">{report.id}</div>

            <div className="text-slate-500">Type</div>
            <div className="font-medium">{report.type}</div>

            <div className="text-slate-500">Car (Make/Model/Year)</div>
            <div className="font-medium">{report.car}</div>

            <div className="text-slate-500">Submitted By</div>
            <div className="font-medium">{report.submittedBy}</div>

            <div className="text-slate-500">Date</div>
            <div className="font-medium">{report.date}</div>

            <div className="text-slate-500">Comment</div>
            <div className="font-medium">{report.comment}</div>

            <div className="text-slate-500">Status</div>
            <div>
              <StatusPill
                status={
                  report.status === "approved"
                    ? "success"
                    : report.status === "rejected"
                    ? "missing"
                    : "pending"
                }
                label={report.status[0].toUpperCase() + report.status.slice(1)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            size="md"
            variant="primary"
            className="flex-1"
            onClick={() => {
              onApprove?.(report);
              onClose();
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
              onClose();
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
