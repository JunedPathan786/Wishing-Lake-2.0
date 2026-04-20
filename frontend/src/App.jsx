import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Loading from './components/Loading';
import toast, { Toaster } from 'react-hot-toast';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TossWishPage = lazy(() => import('./pages/TossWishPage'));
const FulfillWishPage = lazy(() => import('./pages/FulfillWishPage'));
const MyWishesPage = lazy(() => import('./pages/MyWishesPage'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Suspense fallback={<Loading />}><LandingPage /></Suspense>} />
      
      {!isAuthenticated && (
        <>
          <Route path="/login" element={<Suspense fallback={<Loading />}><LoginPage /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={<Loading />}><RegistrationPage /></Suspense>} />
        </>
      )}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route
        path="/toss-wish"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <TossWishPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route
        path="/fulfill-wish"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <FulfillWishPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-wishes"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <MyWishesPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="pt-20">
            <AppRoutes />
          </main>
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;


