import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set auth header dynamically
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Fetch current logged-in user profile
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setAuthHeader(token);
      const res = await axios.get(`${API_URL}/api/auth/me`);
      if (res.data.success) {
        setUser(res.data.data);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Error fetching user profile:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token);
        setUser(res.data.data);
        setAuthHeader(res.data.data.token);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (name, email, password, role, lat, lng) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
        role,
        latitude: lat ? Number(lat) : undefined,
        longitude: lng ? Number(lng) : undefined,
      });
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token);
        setUser(res.data.data);
        setAuthHeader(res.data.data.token);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthHeader(null);
  };

  const updateUserLocation = async (lat, lng) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      // Set temporary coordinates in local React state
      const updatedUser = { ...user, latitude: Number(lat), longitude: Number(lng) };
      setUser(updatedUser);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserLocation, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
