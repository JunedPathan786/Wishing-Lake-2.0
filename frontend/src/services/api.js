// Fontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  profile: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data)
};

// Wish endpoints
export const wishAPI = {
  createWish: (data) => api.post('/wishes', data),
  getAllWishes: (params) => api.get('/wishes', { params }),
  getWishById: (id) => api.get(`/wishes/${id}`),
  getMyWishes: () => api.get('/wishes/user/my-wishes'),
  getFulfillingWishes: () => api.get('/wishes/user/fulfilling'),
  getSavedWishes: () => api.get('/wishes/user/saved'),
  updateWish: (id, data) => api.put(`/wishes/${id}`, data),
  deleteWish: (id) => api.delete(`/wishes/${id}`),
  createFulfillmentRequest: (wishId, message) => 
    api.post(`/wishes/${wishId}/fulfill-request`, { message }),
  saveWish: (wishId) => api.post(`/wishes/${wishId}/save`),
  likeWish: (wishId) => api.post(`/wishes/${wishId}/like`)
};

// User endpoints
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  changePassword: (data) => api.post('/user/change-password', data),
  getNotifications: (params) => api.get('/user/notifications', { params }),
  markNotificationRead: (notificationId) => 
    api.put(`/user/notifications/${notificationId}/read`),
  markAllNotificationsRead: () => api.put('/user/notifications/read-all'),
  getFulfillmentRequests: () => api.get('/user/fulfillment-requests'),
  giveFulfillmentConsent: (requestId) => 
    api.post(`/user/fulfillment-requests/${requestId}/consent`),
  rateFulfillment: (requestId, data) => 
    api.post(`/user/fulfillment-requests/${requestId}/rate`, data),
  getUserStats: () => api.get('/user/stats')
};

// Payment endpoints
export const paymentAPI = {
  createRazorpayOrder: (data) => api.post('/payment/create-razorpay-order', data),
  verifyRazorpayPayment: (data) => api.post('/payment/verify-razorpay', data),
  createStripeIntent: (data) => api.post('/payment/create-stripe-intent', data),
  confirmStripePayment: (data) => api.post('/payment/confirm-stripe', data),
  getPaymentHistory: () => api.get('/payment/history')
};

// Admin endpoints
export const adminAPI = {
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getAllWishes: (params) => api.get('/admin/wishes', { params }),
  getWishDetails: (wishId) => api.get(`/admin/wishes/${wishId}`),
  getAllFulfillmentRequests: (params) => api.get('/admin/fulfillment-requests', { params }),
  approveFulfillmentRequest: (requestId) => 
    api.put(`/admin/fulfillment-requests/${requestId}/approve`),
  rejectFulfillmentRequest: (requestId, data) => 
    api.put(`/admin/fulfillment-requests/${requestId}/reject`, data),
  blockUser: (userId) => api.put(`/admin/users/${userId}/block`),
  getAnalytics: () => api.get('/admin/analytics')
};

export default api;