// client/src/services/api.js
import axios from "axios";

// Create axios instance with configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5100/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds timeout
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        ...error,
        message: "Network error. Please check your connection.",
      });
    }

    // Handle token expiration - 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try to refresh token or get current user
        const { data } = await api.get("/auth/me");

        // If successful, update token and retry original request
        if (data.token) {
          localStorage.setItem("token", data.token);
          api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
          return api(originalRequest);
        }
        return Promise.reject(error);
      } catch (refreshError) {
        // If refresh fails, log out user
        localStorage.removeItem("token");

        // Only redirect if in browser environment
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async ({ username, password }) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      // Set the token in the authorization header immediately
      if (response.data && response.data.token) {
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async ({ username, email, password, role = "editor" }) => {
    try {
      const response = await api.post("/auth/register", {
        username,
        email,
        password,
        role,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// User services
export const userService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get("/data/users", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/data/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (user) => {
    try {
      const response = await api.post("/data/users", user);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, user) => {
    try {
      const response = await api.put(`/data/users/${id}`, user);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/data/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Donation services
export const donationService = {
  getAll: async (filters = {}) => {
    try {
      const response = await api.get("/data/donations", { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/data/donations/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (donation) => {
    try {
      const response = await api.post("/data/donations", donation);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, donation) => {
    try {
      const response = await api.put(`/data/donations/${id}`, donation);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/data/donations/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await api.get("/data/donations/stats/summary");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Campaign services
export const campaignService = {
  getAll: async (filters = {}) => {
    try {
      const response = await api.get("/data/campaigns", { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/data/campaigns/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (campaign) => {
    try {
      if (campaign.attachments && campaign.attachments.length > 0) {
        const formData = new FormData();
        Object.keys(campaign).forEach((key) => {
          if (key !== "attachments") {
            formData.append(key, campaign[key]);
          }
        });
        campaign.attachments.forEach((file) => {
          formData.append("attachments", file);
        });
        const response = await api.post("/data/campaigns", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      }
      const response = await api.post("/data/campaigns", campaign);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, campaign) => {
    try {
      if (
        (campaign.attachments && campaign.attachments.length > 0) ||
        campaign.remove_attachments
      ) {
        const formData = new FormData();
        Object.keys(campaign).forEach((key) => {
          if (key !== "attachments" && key !== "remove_attachments") {
            formData.append(key, campaign[key]);
          }
        });
        if (campaign.attachments) {
          campaign.attachments.forEach((file) => {
            if (file instanceof File) {
              formData.append("attachments", file);
            }
          });
        }
        if (campaign.remove_attachments) {
          formData.append("remove_attachments", campaign.remove_attachments);
        }
        const response = await api.put(`/data/campaigns/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      }
      const response = await api.put(`/data/campaigns/${id}`, campaign);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/data/campaigns/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await api.get("/data/campaigns/stats/summary");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAttachmentUrl: (attachmentId) => {
    // This function now just redirects to the backend,
    // which will redirect to the Cloudinary URL
    const token = localStorage.getItem("token");
    const baseUrl =
      process.env.REACT_APP_API_URL || "http://localhost:5100/api";
    return `${baseUrl}/data/attachments/${attachmentId}?token=${token}`;
  },
};

// Dashboard service
export const dashboardService = {
  getOverview: async () => {
    try {
      const response = await api.get("/data/dashboard/overview");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
