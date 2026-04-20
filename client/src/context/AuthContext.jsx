import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    displayName: user.displayName || user.name || user.username || '',
    name: user.name || user.displayName || user.username || '',
  };
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload, isLoading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ─── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      try {
        const { data } = await authAPI.getMe();
        const meUser = data?.data?.user || data?.user || null;
        dispatch({ type: 'SET_USER', payload: normalizeUser(meUser) });
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    initAuth();
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await authAPI.login({ email, password });
      const authData = data?.data || data || {};
      const user = authData.user || data?.user || null;
      const accessToken = authData.accessToken || data?.accessToken || data?.token || null;
      const refreshToken = authData.refreshToken || data?.refreshToken || null;

      if (!user || !accessToken) {
        throw new Error('Invalid login response from server.');
      }

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      else localStorage.removeItem('refreshToken');
      dispatch({ type: 'SET_USER', payload: normalizeUser(user) });
      toast.success(`Welcome back, ${user.displayName || user.name || user.username || 'Wisher'}! ✨`, { className: 'toast-dark' });
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, error: message };
    }
  }, []);

  // ─── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await authAPI.register(userData);
      const authData = data?.data || data || {};
      const user = authData.user || data?.user || null;
      const accessToken = authData.accessToken || data?.accessToken || data?.token || null;
      const refreshToken = authData.refreshToken || data?.refreshToken || null;

      if (!user || !accessToken) {
        throw new Error('Invalid registration response from server.');
      }

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      else localStorage.removeItem('refreshToken');
      dispatch({ type: 'SET_USER', payload: normalizeUser(user) });
      toast.success('Account created! Check your email to verify. ✉️', { className: 'toast-dark' });
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, error: message };
    }
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Proceed even if API call fails
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
    toast('Farewell, dear wisher 🌙', { className: 'toast-dark' });
  }, []);

  // ─── Update profile ────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (profileData) => {
    try {
      const { data } = await authAPI.updateProfile(profileData);
      const updatedUser = data?.data?.user || data?.user || null;
      dispatch({ type: 'UPDATE_USER', payload: normalizeUser(updatedUser || profileData) });
      toast.success('Profile updated!', { className: 'toast-dark' });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Update failed.';
      toast.error(message, { className: 'toast-dark' });
      return { success: false, error: message };
    }
  }, []);

  // ─── Refresh user data ─────────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      const meUser = data?.data?.user || data?.user || null;
      dispatch({ type: 'SET_USER', payload: normalizeUser(meUser) });
    } catch {}
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    isAdmin: state.user?.role === 'admin',
    isModerator: ['admin', 'moderator'].includes(state.user?.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
