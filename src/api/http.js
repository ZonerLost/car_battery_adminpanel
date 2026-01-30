import axios from "axios";
import { auth } from "../lib/firebase";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 20000,
});

http.interceptors.request.use(async (config) => {
  const user = auth.currentUser;

  // Attach Firebase ID token for your backend (if you have one)
  if (user) {
    const token = await user.getIdToken();
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
