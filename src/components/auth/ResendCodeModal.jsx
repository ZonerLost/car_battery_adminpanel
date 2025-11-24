import React from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";

const ResendCodeModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Code Sent" size="sm">
      <div className="space-y-3">
        <p className="text-xs text-slate-600 leading-relaxed">
          We just sent you a new verification code. Please check your messages and
          enter the latest code to continue.
        </p>
        <div className="flex justify-end">
          <Button type="button" variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ResendCodeModal;
