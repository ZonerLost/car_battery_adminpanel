import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "../../components/shared/Modal";
import TextField from "../../components/shared/TextField";
import Button from "../../components/shared/Button";
import { sendCustomPasswordReset, isValidEmail } from "../../api/auth/authHelper";

const ForgotPasswordModal = ({ isOpen, onClose, defaultEmail = "" }) => {
  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      setSent(false);
      setIsSubmitting(false);
      setError("");
    }
  }, [isOpen, defaultEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      setEmail(trimmedEmail);
      await sendCustomPasswordReset(trimmedEmail);
      setSent(true);
      toast.success("Reset link sent! Check your inbox.");
    } catch (err) {
      const msg = err?.message || "Could not send reset email. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Password" size="sm" closeDisabled={isSubmitting}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!sent ? (
          <>
            <p className="text-[11px] text-slate-500">
              Enter your registered email and we&apos;ll send you a reset link.
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
                disabled={isSubmitting}
              />
              {error && (
                <p className="mt-1 text-[11px] text-red-500">{error}</p>
              )}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-between">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                fullWidth
                disabled={isSubmitting}
                isLoading={isSubmitting}
                loadingText="Sending..."
              >
                Send Reset Link
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-[12px] text-green-700">
              If an account exists for <span className="font-medium">{email}</span>, a reset link has been sent. Check your inbox and spam folder.
            </div>
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
