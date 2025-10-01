// src/utils/axiosInstance.js
import axios from "axios";
import { auth } from "../firebase";

const API_BASE_URL = import.meta.env.VITE_SOCKET_SERVER || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Add interceptor to attach token automatically
axiosInstance.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(); // Always fetch latest token
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
