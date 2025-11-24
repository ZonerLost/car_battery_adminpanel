import React from "react";
import Modal from "../../components/shared/Modal";
import Button from "../../components/shared/Button";

const ResendCodeModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Code Sent"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-[11px] text-slate-500">
          A new 6-digit verification code has been sent to your registered
          email or phone. Please check your inbox and enter the code to
          continue.
        </p>

        <div className="mt-2 flex justify-end">
          <Button type="button" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ResendCodeModal;
