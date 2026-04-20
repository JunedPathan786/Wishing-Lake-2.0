import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import PageLoader from './components/PageLoader';

// ─── Lazy load pages ──────────────────────────────────────────────────────────
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const WishingLakePage = lazy(() => import('./pages/WishingLakePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const WishOraclePage = lazy(() => import('./pages/WishOraclePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// ─── Route guards ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAdmin, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return !isAuthenticated ? children : <Navigate to="/lake" replace />;
};

// ─── App Layout ───────────────────────────────────────────────────────────────
const AppLayout = () => {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/lake" element={<WishingLakePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/chat/:chatRoomId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/oracle" element={<ProtectedRoute><WishOraclePage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppLayout />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'toast-dark',
              duration: 4000,
              style: {
                background: '#0F172A',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F8FAFC',
                fontFamily: 'Outfit, sans-serif',
                borderRadius: '12px',
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
