import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/dashboard/DashboardPage";
import SettingsPage from "./pages/settings/SettingsPage";
import CarDatabasePage from "./pages/car-database/CarDatabasePage";
import FeedbackReportsPage from "./pages/feedback/FeedbackReportsPage";
import DiagramManagementPage from "./pages/diagram/DiagramManagementPage";
import LoginPage from "./pages/auth/LoginPage";

import VerifyCodePage from "./pages/auth/VerifyCodePage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public auth route */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify" element={<VerifyCodePage />} />
          {/* Protected dashboard routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/car-database" element={<CarDatabasePage />} />
              <Route
                path="/feedback-reports"
                element={<FeedbackReportsPage />}
              />
              <Route
                path="/diagram-management"
                element={<DiagramManagementPage />}
              />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Fallback – unknown routes go home (ProtectedRoute will redirect to /login if needed) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
