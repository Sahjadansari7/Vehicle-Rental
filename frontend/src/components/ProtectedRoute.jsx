import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps any route that requires the user to be authenticated.
 * Optionally enforces admin-only access with the `adminOnly` prop.
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
        <p style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
          Authenticating session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
