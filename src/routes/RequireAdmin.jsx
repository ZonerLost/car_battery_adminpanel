import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAdmin({ children }) {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return null; // or a spinner
  if (!isAuthenticated) return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  if (!isAdmin) return <Navigate to="/auth/login" replace />;

  return children;
}
