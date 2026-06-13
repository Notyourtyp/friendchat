// client/src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler — clear session and reload
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: () => api.get("/users"),
  getFriends: () => api.get("/users/friends"),
  getById: (id) => api.get(`/users/${id}`),
};

// ── Friend Requests ───────────────────────────────────────────────────────────
export const friendRequestsAPI = {
  send: (receiverId) => api.post("/friend-requests", { receiverId }),
  getIncoming: () => api.get("/friend-requests/incoming"),
  getSent: () => api.get("/friend-requests/sent"),
  accept: (id) => api.patch(`/friend-requests/${id}/accept`),
  reject: (id) => api.patch(`/friend-requests/${id}/reject`),
  canMessage: (userId) => api.get(`/friend-requests/check/${userId}`),
};
