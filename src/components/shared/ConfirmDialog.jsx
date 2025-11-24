import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import Alert from "./Alert";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // danger | primary
}) => {
  const isDanger = variant === "danger";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-3">
        {/* {isDanger && (
          <Alert type="danger" title="Warning">
            This action cannot be undone.
          </Alert>
        )} */}
        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={isDanger ? "danger" : "primary"}
          size="sm"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
