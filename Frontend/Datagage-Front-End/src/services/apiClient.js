import axios from "axios";

// Create a base API client instance
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
  withCredentials: true,
});

// Add request interceptor for auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log API errors
    console.error("API Error:", error.response || error);

    // You can handle specific error codes here
    if (error.response?.status === 401) {
      // Handle unauthorized errors (e.g., redirect to login)
      console.warn("Authentication required");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
