
import React, { useState } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/shared/Button";
import TextField from "../../components/shared/TextField";
import ForgotPasswordModal from "../../components/auth/ForgotPasswordModal";

const LoginPage = () => {
  const [values, setValues] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from || "/";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: replace with real API call
      await new Promise((res) => setTimeout(res, 800));
      console.log("Login with", values);

      // fake token + user for now
      const token = "fake-jwt-token";
      const user = { email: values.email };

      login({ token, user });

      // redirect to page user wanted or dashboard
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      // TODO: show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: integrate Google OAuth
    console.log("Google sign-in clicked");
  };

  return (
    <>
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
        {/* LEFT IMAGE PANEL */}
        <div className="hidden lg:block relative">
          <img
            src="images/img.jpg"
            alt="Red sports car in a garage"
            className="h-full w-full object-cover"
          />

          {/* Dark overlay + caption */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8">
            <p className="max-w-md text-sm text-slate-100 mb-6">
              Empower first responders with accurate, real-time data - your updates keep lives safer.
            </p>

            {/* Slider dots */}
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-4 rounded-full bg-white" />
              <span className="h-2 w-2 rounded-full bg-white/50" />
              <span className="h-2 w-2 rounded-full bg-white/50" />
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="flex items-center justify-center px-4 py-8 lg:py-0">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-[20px] md:text-[24px] font-semibold text-black leading-snug">
                Welcome to the Car Battery Locator Admin Panel
              </h1>

              <p className="mt-1 text-[14px] text-slate-500">
                Manage the global database and user feedback.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <TextField
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="pl-9"
                  />
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <FiMail className="text-[14px]" />
                  </span>
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-[11px] text-[#2563eb] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <TextField
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={values.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="pl-9 pr-9"
                  />
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <FiLock className="text-[14px]" />
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <FiEyeOff className="text-[16px]" />
                    ) : (
                      <FiEye className="text-[16px]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                fullWidth
                disabled={isSubmitting}
                className="mt-2"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
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
                onClick={handleGoogleSignIn}
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

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        defaultEmail={values.email}
      />
    </>
  );
};

export default LoginPage;

