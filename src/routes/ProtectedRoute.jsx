import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  // While Firebase checks session
  if (loading) return null; // you can replace with a spinner component

  // Not logged in
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search, reason: "not-admin" }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
