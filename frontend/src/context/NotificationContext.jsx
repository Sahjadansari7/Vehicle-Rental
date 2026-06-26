import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isFirstFetch = useRef(true);
  const knownIdsRef = useRef(new Set());

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/api/notifications`);
      if (res.data.success) {
        const fetchedList = res.data.data || [];
        const count = res.data.unreadCount || 0;

        if (isFirstFetch.current) {
          // Store initial IDs without toast warnings
          const ids = new Set(fetchedList.map(n => n._id));
          knownIdsRef.current = ids;
          setNotifications(fetchedList);
          setUnreadCount(count);
          isFirstFetch.current = false;
        } else {
          // Identify brand new notifications (not in known list) and trigger a live toast
          const newNotifs = fetchedList.filter(n => !knownIdsRef.current.has(n._id));
          
          if (newNotifs.length > 0) {
            newNotifs.forEach(notif => {
              // Trigger a toast for each new notification
              let toastType = 'info';
              if (notif.type.includes('success') || notif.type.includes('confirmed')) {
                toastType = 'success';
              } else if (notif.type.includes('cancelled') || notif.type.includes('deleted')) {
                toastType = 'error';
              }
              addToast(notif.message, toastType);
              
              // Add to known IDs
              knownIdsRef.current.add(notif._id);
            });
          }

          setNotifications(fetchedList);
          setUnreadCount(count);
        }
      }
    } catch (err) {
      console.error('[NotificationContext] Failed to fetch notifications:', err.message);
    }
  }, [user, addToast]);

  // Fetch notifications on mount/login and start polling
  useEffect(() => {
    if (user) {
      isFirstFetch.current = true;
      knownIdsRef.current = new Set();
      fetchNotifications();

      const pollInterval = setInterval(() => {
        fetchNotifications(true);
      }, 15000); // Poll every 15 seconds

      return () => clearInterval(pollInterval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      isFirstFetch.current = true;
      knownIdsRef.current = new Set();
    }
  }, [user, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/api/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('[NotificationContext] Mark as read failed:', err.message);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const res = await axios.put(`${API_URL}/api/notifications/read-all`);
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[NotificationContext] Mark all as read failed:', err.message);
    }
  };

  // Delete single notification
  const deleteNotification = async (id) => {
    try {
      const res = await axios.delete(`${API_URL}/api/notifications/${id}`);
      if (res.data.success) {
        const deletedNotif = notifications.find(n => n._id === id);
        setNotifications(prev => prev.filter(n => n._id !== id));
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        knownIdsRef.current.delete(id);
      }
    } catch (err) {
      console.error('[NotificationContext] Delete notification failed:', err.message);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const res = await axios.delete(`${API_URL}/api/notifications`);
      if (res.data.success) {
        setNotifications([]);
        setUnreadCount(0);
        knownIdsRef.current = new Set();
      }
    } catch (err) {
      console.error('[NotificationContext] Clear all notifications failed:', err.message);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
