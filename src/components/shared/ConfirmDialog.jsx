import React from "react";
import Modal from "./Modal";
import Button from "./Button";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // danger | primary
  loading = false,
  loadingLabel,
  errorText = "",
}) => {
  const isDanger = variant === "danger";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" closeDisabled={loading}>
      <div className="space-y-3">
        {/* {isDanger && (
          <Alert type="danger" title="Warning">
            This action cannot be undone.
          </Alert>
        )} */}
        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
        {errorText ? <p className="text-xs text-red-600">{errorText}</p> : null}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={isDanger ? "danger" : "primary"}
          size="sm"
          onClick={loading ? undefined : onConfirm}
          isLoading={loading}
          loadingText={loadingLabel || confirmLabel}
          disabled={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
