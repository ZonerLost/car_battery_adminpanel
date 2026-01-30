/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../lib/firebase";
import Button from "../../components/shared/Button";
import TextField from "../../components/shared/TextField";

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = params.get("oobCode"); // Firebase includes this in the link
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      } catch (e) {
        setError("This reset link is invalid or expired. Please request a new one.");
      } finally {
        setChecking(false);
      }
    };

    run();
  }, [oobCode]);

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
    } catch (e) {
      setError("Failed to reset password. Please request a new reset link.");
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
              <TextField
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">
                Confirm Password
              </label>
              <TextField
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>

            <Button type="submit" fullWidth disabled={!canSubmit}>
              {submitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        ) : null}

        {!checking && done ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-[12px] text-green-700">
              Password updated successfully. You can now login.
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
