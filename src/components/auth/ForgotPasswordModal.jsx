import React, { useEffect, useState } from "react";
import Modal from "../../components/shared/Modal";
import TextField from "../../components/shared/TextField";
import Button from "../../components/shared/Button";

const ForgotPasswordModal = ({ isOpen, onClose, defaultEmail = "" }) => {
  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      setSent(false);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      // TODO: call your forgot-password API
      await new Promise((res) => setTimeout(res, 800));
      setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Password"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!sent ? (
          <>
            <p className="text-[11px] text-slate-500">
              Enter your registered email address and we&apos;ll send you a link
              to reset your password.
            </p>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">
                Email address
              </label>
              <TextField
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-between">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[11px] text-slate-500">
              If an account exists for <span className="font-medium">{email}</span>, 
              you&apos;ll receive an email with instructions to reset your password.
            </p>
            <div className="mt-4 flex justify-end">
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default ForgotPasswordModal;
