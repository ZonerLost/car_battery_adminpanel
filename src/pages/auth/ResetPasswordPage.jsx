import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { auth } from "../../lib/firebase";
import Button from "../../components/shared/Button";

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = params.get("oobCode");
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;

  const canSubmit = useMemo(() => {
    return password.length >= 8 && password === confirm && !!oobCode && !submitting;
  }, [password, confirm, oobCode, submitting]);

  useEffect(() => {
    const run = async () => {
      if (!oobCode) {
        setError("Invalid or missing reset link. Please request a new one.");
        setChecking(false);
        return;
      }

      try {
        const mail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(mail);
      } catch {
        const msg = "This reset link is invalid or expired. Please request a new one.";
        setError(msg);
        toast.error(msg);
      } finally {
        setChecking(false);
      }
    };

    run();
  }, [oobCode]);

  // Auto-redirect after success
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(timer);
  }, [done, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!oobCode) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setDone(true);
      toast.success("Password reset successfully! Redirecting to login...");
    } catch {
      const msg = "Failed to reset password. Please request a new reset link.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-md">
        <h1 className="text-[20px] md:text-[22px] font-semibold text-slate-900">
          Reset Password
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          {checking ? "Checking your reset link..." : email ? `For: ${email}` : ""}
        </p>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
            {error}
          </div>
        ) : null}

        {!checking && !done && !error ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  disabled={submitting}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-9 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-[#E53935]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  disabled={submitting}
                  className={`w-full rounded-lg border px-3 py-2 pr-9 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-[#E53935] ${
                    mismatch ? "border-red-300" : "border-slate-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
              {mismatch && (
                <p className="mt-1 text-[11px] text-red-500">Passwords do not match.</p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={!canSubmit}
              isLoading={submitting}
              loadingText="Resetting..."
            >
              Reset Password
            </Button>
          </form>
        ) : null}

        {!checking && done ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-[12px] text-green-700">
              Password updated successfully. Redirecting to login in a moment...
            </div>
            <Button type="button" fullWidth onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
