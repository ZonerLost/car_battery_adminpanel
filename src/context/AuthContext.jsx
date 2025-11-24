import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "car-admin-auth";

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { isAuthenticated: false, token: null, user: null };
      }
      const parsed = JSON.parse(raw);
      if (parsed?.token) {
        return {
          isAuthenticated: true,
          token: parsed.token,
          user: parsed.user || null,
        };
      }
      return { isAuthenticated: false, token: null, user: null };
    } catch (err) {
      console.error("Failed to read auth from storage", err);
      return { isAuthenticated: false, token: null, user: null };
    }
  });

  const login = ({ token, user }) => {
    const next = {
      isAuthenticated: true,
      token,
      user: user || null,
    };
    setAuth(next);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token, user: user || null })
    );
  };

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      token: null,
      user: null,
    });
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
