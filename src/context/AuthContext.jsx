/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { auth } from "../lib/firebase";
import { signInAdmin, logout as fbLogout } from "../api/auth/authHelper";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    token: null,
    claims: null,
    loading: true,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, token: null, claims: null, loading: false });
        return;
      }

      const token = await user.getIdToken();
      const tokenResult = await getIdTokenResult(user);
      setState({
        user,
        token,
        claims: tokenResult?.claims || {},
        loading: false,
      });
    });

    return () => unsub();
  }, []);

  const value = useMemo(() => {
    const isAuthenticated = !!state.user;
    const isAdmin = !!state.claims?.admin;

    return {
      ...state,
      isAuthenticated,
      isAdmin,

      // email/password login (admin only)
      async login(email, password) {
        return await signInAdmin(email, password);
      },

      async logout() {
        await fbLogout();
      },
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
