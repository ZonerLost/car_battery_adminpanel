import React, { useEffect, useRef, useState } from "react";
import Button from "../../components/shared/Button";
import ResendCodeModal from "../../components/auth/ResendCodeModal";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

const VerifyCodePage = () => {
  const [code, setCode] = useState(
    Array.from({ length: OTP_LENGTH }, () => "")
  );
  const inputRefs = useRef([]);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendModalOpen, setIsResendModalOpen] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const handleChange = (index, value) => {
    const digit = value.slice(-1).replace(/\D/g, "");
    setCode((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || "");
    setCode(next);

    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    if (lastIndex >= 0) {
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const joined = code.join("");
    if (joined.length !== OTP_LENGTH) {
      // TODO: show toast "Please enter the full 6-digit code"
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: call verify-code API with `joined`
      await new Promise((res) => setTimeout(res, 800));
      console.log("Verified OTP:", joined);

      // In a real flow you might:
      // - complete login
      // - navigate("/")

    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;

    setIsResending(true);
    try {
      // TODO: call resend-code API
      await new Promise((res) => setTimeout(res, 800));
      setSecondsLeft(RESEND_SECONDS);
      setIsResendModalOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResending(false);
    }
  };

  const formattedTime = `00:${secondsLeft.toString().padStart(2, "0")}`;

  return (
    <>
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
        {/* LEFT IMAGE PANEL */}
        <div className="hidden lg:block relative">
          <img
            src="car.jpg"
            alt="Classic cars in a garage"
            className="h-full w-full object-cover"
          />

          {/* Dark overlay + caption */}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8">
            <p className="max-w-md text-sm text-slate-100 mb-6">
              Every diagram you upload and every report you verify helps users
              save precious seconds.
            </p>

            {/* Slider dots */}
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-white" />
              <span className="h-2 w-4 rounded-full bg-white/50" />
              <span className="h-2 w-2 rounded-full bg-white/50" />
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT PANEL */}
        <div className="flex items-center justify-center px-4 py-8 lg:py-0">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-[20px] md:text-[22px] font-semibold text-slate-900 leading-snug">
                Verify Your Code
              </h1>
              <p className="mt-1 text-[13px] text-slate-500">
                Enter the 6-digit code we just sent to your phone or email to
                continue.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP inputs */}
              <div
                className="flex flex-wrap justify-center gap-2 sm:gap-3"
                onPaste={handlePaste}
              >
                {code.map((value, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="h-12 w-10 flex-1 max-w-12 rounded-lg border border-slate-200 bg-white text-center text-[18px] font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-[#E53935]"
                  />
                ))}
              </div>

              {/* Timer + resend */}
              <div className="text-center text-[11px] text-slate-500">
                <span className="mr-1">{formattedTime} Sec Remaining,</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={secondsLeft > 0 || isResending}
                  className={`font-medium ${
                    secondsLeft > 0 || isResending
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-[#2563eb] hover:underline"
                  }`}
                >
                  Resend Code
                </button>
              </div>

              {/* Verify button */}
              <Button
                type="submit"
                fullWidth
                disabled={isSubmitting}
                className="mt-2"
              >
                {isSubmitting ? "Verifying..." : "Verify"}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                <span>OR</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Google button */}
              <button
                type="button"
                onClick={() => console.log("Google verify clicked")}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="h-4 w-4"
                />
                <span>Google</span>
              </button>
            </form>

            {/* Footer text */}
            <div className="mt-8 text-center text-[11px] text-slate-500">
              Facing any issues?{" "}
              <button
                type="button"
                className="font-medium text-[#2563eb] hover:underline"
                onClick={() =>
                  window.open("mailto:support@carbatteryadmin.com", "_blank")
                }
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resend confirmation modal */}
      <ResendCodeModal
        isOpen={isResendModalOpen}
        onClose={() => setIsResendModalOpen(false)}
      />
    </>
  );
};

export default VerifyCodePage;
