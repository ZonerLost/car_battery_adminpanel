import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";

// Suppress noisy onboarding.js errors injected by external dev tooling/extensions
if (import.meta.env.DEV && typeof window !== "undefined") {
  const suppressOnboarding = (reason) => {
    const text = String(reason?.stack || reason?.message || reason || "");
    if (text.includes("onboarding.js")) {
      console.warn("[dev] Suppressed onboarding.js error:", text);
      return true;
    }
    return false;
  };

  window.addEventListener(
    "error",
    (event) => {
      if (suppressOnboarding(event)) event.preventDefault();
    },
    true
  );

  window.addEventListener("unhandledrejection", (event) => {
    if (suppressOnboarding(event.reason)) event.preventDefault();
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" />
  </StrictMode>
);
