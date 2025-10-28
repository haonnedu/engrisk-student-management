import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "msjenny.io.vn"
    ? "https://msjenny.io.vn/api/v1"
    : "http://localhost:3001/api/v1");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors and format error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Dispatch custom event to notify components about auth error
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    }

    // Format error message
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Handle array of messages
      if (Array.isArray(errorData.message)) {
        error.message = errorData.message.join(', ');
      } 
      // Handle single message
      else if (typeof errorData.message === 'string') {
        error.message = errorData.message;
      }
      // Fallback to error field
      else if (errorData.error) {
        error.message = errorData.error;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
