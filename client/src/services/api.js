import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, Promise.reject);

// ─── Response interceptor: handle 401 / token refresh ───────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        // Force logout
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── API Methods ─────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: async () => {
    try {
      // Prefer route available in current backend.
      return await api.get('/user/profile');
    } catch (userProfileError) {
      if (userProfileError.response?.status !== 404) throw userProfileError;
      try {
        return await api.get('/auth/me');
      } catch (authMeError) {
        if (authMeError.response?.status === 404) return api.get('/auth/profile');
        throw authMeError;
      }
    }
  },
  updateProfile: async (data) => {
    try {
      return await api.patch('/auth/update-profile', data);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 405) {
        const payload = {
          name: data.displayName || data.name,
          avatar: data.avatar,
        };
        return api.put('/user/profile', payload);
      }
      throw error;
    }
  },
  changePassword: (data) => api.patch('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.patch(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
};

export const wishAPI = {
  getFeed: (params) => api.get('/wishes', { params }),
  getMyWishes: async (params) => {
    try {
      return await api.get('/wishes/mine', { params });
    } catch (error) {
      if (error.response?.status === 404) return api.get('/wishes/user/my-wishes', { params });
      throw error;
    }
  },
  getWish: (id) => api.get(`/wishes/${id}`),
  createWish: (data) => api.post('/wishes', data),
  updateWish: async (id, data) => {
    try {
      return await api.patch(`/wishes/${id}`, data);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 405) return api.put(`/wishes/${id}`, data);
      throw error;
    }
  },
  deleteWish: (id) => api.delete(`/wishes/${id}`),
  toggleLike: async (id) => {
    try {
      return await api.patch(`/wishes/${id}/like`);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 405) return api.post(`/wishes/${id}/like`);
      throw error;
    }
  },
  reportWish: (id, reason) => api.post(`/wishes/${id}/report`, { reason }),
};

export const fulfillmentAPI = {
  offerFulfillment: async (wishId, data) => {
    try {
      return await api.post(`/fulfillment/wish/${wishId}/offer`, data);
    } catch (error) {
      if (error.response?.status === 404) return api.post(`/wishes/${wishId}/fulfill-request`, data);
      throw error;
    }
  },
  respondToFulfillment: (requestId, action, note) =>
    api.patch(`/fulfillment/${requestId}/respond`, { action, note }),
  getWishRequests: (wishId) => api.get(`/fulfillment/wish/${wishId}`),
  getMyFulfillments: async () => {
    try {
      return await api.get('/fulfillment/mine');
    } catch (error) {
      if (error.response?.status === 404) return api.get('/user/fulfillment-requests');
      throw error;
    }
  },
  markComplete: (requestId, proof) => api.patch(`/fulfillment/${requestId}/complete`, { proof }),
};

export const chatAPI = {
  getMyChatRooms: () => api.get('/chat'),
  requestChat: (data) => api.post('/chat/request', data),
  respondToRequest: (chatRoomId, action) => api.patch(`/chat/${chatRoomId}/respond`, { action }),
  getMessages: (chatRoomId, params) => api.get(`/chat/${chatRoomId}/messages`, { params }),
  sendMessage: (chatRoomId, content, type) => api.post(`/chat/${chatRoomId}/messages`, { content, type }),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
};

export const notificationAPI = {
  getAll: async (params) => {
    try {
      // Prefer the active backend route to avoid noisy 404s.
      const userRes = await api.get('/user/notifications', { params });
      const list = userRes?.data?.notifications || [];
      const unreadCount = userRes?.data?.unreadCount || 0;
      return { data: { data: { notifications: list }, unreadCount } };
    } catch (error) {
      if (error.response?.status === 404) return { data: { data: { notifications: [] }, unreadCount: 0 } };
      throw error;
    }
  },
  markRead: async (id) => {
    try {
      return await api.put(`/user/notifications/${id}/read`);
    } catch (error) {
      if (error.response?.status === 404) return { data: { success: true } };
      throw error;
    }
  },
  markAllRead: async () => {
    try {
      return await api.put('/user/notifications/read-all');
    } catch (error) {
      if (error.response?.status === 404) return { data: { success: true } };
      throw error;
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/notifications/${id}`);
    } catch (error) {
      if (error.response?.status === 404) return { data: { success: true } };
      throw error;
    }
  },
};

export const aiAPI = {
  analyzeWish: (wishId) => api.get(`/ai/analyze/${wishId}`),
  getRecommendations: () => api.get('/ai/recommendations'),
  oracleChat: (message, context) => api.post('/ai/oracle/chat', { message, context }),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (userId, data) => api.patch(`/admin/users/${userId}`, data),
  getReportedWishes: () => api.get('/admin/wishes/reported'),
  moderateWish: (wishId, action, note) => api.patch(`/admin/wishes/${wishId}/moderate`, { action, note }),
  getPendingChats: () => api.get('/admin/chats/pending'),
  approveChat: (chatRoomId, action, note) => api.patch(`/admin/chats/${chatRoomId}`, { action, note }),
  broadcast: (data) => api.post('/admin/broadcast', data),
};

export const usersAPI = {
  getProfile: (username) => api.get(`/users/${username}/profile`),
  getLeaderboard: () => api.get('/users/leaderboard'),
  blockUser: (userId) => api.patch(`/users/block/${userId}`),
  unblockUser: (userId) => api.patch(`/users/unblock/${userId}`),
};

export default api;
