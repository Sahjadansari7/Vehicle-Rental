import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import LocationFinder from './pages/LocationFinder';
import BookingDetails from './pages/BookingDetails';
import PaymentCallback from './pages/PaymentCallback';
import History from './pages/History';
import Admin from './pages/Admin';
import Earnings from './pages/Earnings';
import VehicleList from './pages/VehicleList';

/** Redirects admin users to /admin when they visit / */
const HomeOrAdmin = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Home />;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <BrowserRouter>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Navbar />
              <main style={{ flex: 1 }}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomeOrAdmin />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/locations" element={<LocationFinder />} />

                  {/* Protected: Authenticated users */}
                  <Route
                    path="/booking-checkout"
                    element={
                      <ProtectedRoute>
                        <BookingDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment-callback"
                    element={
                      <ProtectedRoute>
                        <PaymentCallback />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <History />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected: Admin only */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute adminOnly>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/earnings"
                    element={
                      <ProtectedRoute adminOnly>
                        <Earnings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/vehiclelist"
                    element={
                      <ProtectedRoute adminOnly>
                        <VehicleList />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback: redirect unknown routes to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
