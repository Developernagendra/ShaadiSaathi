import axios from "axios";
import toast from "react-hot-toast";

// ============================================
// Production Ready API Base URL
// ============================================

const BASE_URL =
   import.meta.env.VITE_API_URL ||
   "https://shaadisaathi-3.onrender.com/api";


// ============================================
// Axios Instance
// ============================================

const API = axios.create({
   baseURL: BASE_URL,
   withCredentials: true,
   timeout: 75000, // Increased to 75 seconds to handle Render free-tier cold starts
   headers: {
      "Content-Type": "application/json",
   },
});

// ============================================
// Request Interceptor
// ============================================

API.interceptors.request.use(
   (config) => {
      const token = localStorage.getItem("token");

      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
   },
   (error) => Promise.reject(error)
);

// ============================================
// Response Interceptor
// ============================================

API.interceptors.response.use(
   (response) => response,

   async (error) => {
      const { config } = error;

      // Handle cases where request config is missing (cannot retry)
      if (!config) {
         return Promise.reject(error);
      }

      // Check if this error is caused by a cold start or network connection failure
      const isTimeout = error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout');
      const isNetwork = !error.response && (error.code === 'ERR_NETWORK' || error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('failed'));
      const isProbablyColdStart = !error.response && (isTimeout || isNetwork);

      if (isProbablyColdStart) {
         config.retryCount = config.retryCount || 0;
         const maxRetries = 5; // Up to 5 retries at 6s intervals covers a full 40-50s Render cold boot

         if (config.retryCount < maxRetries) {
            config.retryCount += 1;
            const delayMs = 6000; // 6 seconds backoff between retries

            console.warn(`⚠️ Render Cold Start/Network issue detected. Retrying silently: ${config.url} (Attempt ${config.retryCount}/${maxRetries}) in ${delayMs}ms...`);

            // Wait for the backoff delay
            await new Promise((resolve) => setTimeout(resolve, delayMs));

            // Retry the request silently using the same Axios instance
            return API(config);
         }
      }

      // --------------------------------
      // Handle Standard Errors (No Retry or Retries Exhausted)
      // --------------------------------
      if (!error.response) {
         return Promise.reject({
            success: false,
            message: "Unable to connect to the wedding server. Please check your internet connection or try again shortly.",
            isNetworkError: true
         });
      }

      // --------------------------------
      // Handle Unauthorized
      // --------------------------------
      if (error.response.status === 401) {
         localStorage.removeItem("token");
         localStorage.removeItem("user");
         // Dispatch logout to clear Redux state
         import('../store/store').then(({ default: store }) => {
            store.dispatch({ type: 'auth/logout' });
         });
      }

      // --------------------------------
      // Handle Server Error
      // --------------------------------
      if (error.response.status >= 500) {
         console.error("❌ Server Error:", error.response.data);
      }

      return Promise.reject(error.response.data || error);
   }
);

// ============================================
// Health Check
// ============================================

export const checkBackendHealth = async () => {
   try {
      const res = await API.get("/health");
      return res.data;
   } catch (err) {
      console.error("❌ Health check failed");
      return null;
   }
};

// ============================================
// API Endpoints
// ============================================

export const AuthAPI = {
   login: (data) => API.post("/auth/login", data),
   register: (data) => API.post("/auth/register", data),
   me: () => API.get("/auth/me"),
};

export const VendorAPI = {
   featured: () => API.get("/vendors/featured"),
   all: (params) => API.get("/vendors", { params }),
};

export const CategoryAPI = {
   all: () => API.get("/categories"),
};

export const FeatureAPI = {
   blogs: () => API.get("/features/blogs"),
   stats: () => API.get("/features/stats"),
   testimonials: () => API.get("/features/testimonials"),
   contactInfo: () => API.get("/features/contact-info"),
};

export const NotificationAPI = {
   all: () => API.get("/notifications"),
};

// ============================================
// Default Export
// ============================================

export default API;