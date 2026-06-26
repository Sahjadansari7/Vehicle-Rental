import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Sun, Moon, Monitor, LogOut, Car, TrendingUp,
  ShieldAlert, Menu, X, User, Bell, Trash2, Check, BellOff
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isSystemTheme } = useTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
    setShowNotifications(false);
  };

  const close = () => {
    setIsOpen(false);
    setShowNotifications(false);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'booking_created':
        return '📅';
      case 'booking_confirmed':
        return '✅';
      case 'booking_cancelled':
        return '❌';
      case 'refund_processed':
        return '💸';
      case 'vehicle_updated':
        return '🔧';
      case 'vehicle_deleted':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const handleNotifClick = (notif) => {
    markAsRead(notif._id);
    setShowNotifications(false);
    close();
    if (user.role === 'admin') {
      if (notif.relatedVehicle) {
        navigate('/vehiclelist');
      } else {
        navigate('/admin');
      }
    } else {
      navigate('/history');
    }
  };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="container nav-container">
        {/* Brand */}
        <Link to="/" className="brand" onClick={close}>
          <div className="brand-icon">
            <Car size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span>VEHICLE.RENT</span>
        </Link>

        {/* Hamburger for mobile */}
        <button
          className="hamburger-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Nav links */}
        <div className={`nav-links${isOpen ? ' open' : ''}`} onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}>
          {(!user || user.role !== 'admin') && (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={close}
              >
                Vehicles
              </NavLink>
              <NavLink
                to="/locations"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={close}
              >
                Branches
              </NavLink>
            </>
          )}

          {user ? (
            <>
              {user.role !== 'admin' && (
                <NavLink
                  to="/history"
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  onClick={close}
                >
                  My Bookings
                </NavLink>
              )}

              {user.role === 'admin' && (
                <>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    onClick={close}
                  >
                    <ShieldAlert size={14} />
                    Admin
                  </NavLink>
                  <NavLink
                    to="/vehiclelist"
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    onClick={close}
                  >
                    <Car size={14} />
                    Vehicles
                  </NavLink>
                  <NavLink
                    to="/earnings"
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    onClick={close}
                  >
                    <TrendingUp size={14} />
                    Earnings
                  </NavLink>
                </>
              )}

              <div className="nav-divider" />

              {/* User info + logout */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '6px 12px',
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}>
                  <User size={13} />
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {user.name}
                  </span>
                </div>

                {/* Notification Dropdown */}
                <div className="notification-container" ref={dropdownRef}>
                  <button
                    className={`notification-bell-btn${showNotifications ? ' active' : ''}`}
                    onClick={() => setShowNotifications(!showNotifications)}
                    aria-label="Toggle notifications"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="notification-badge" id="notif-badge">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="notification-dropdown">
                      <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                          <button className="notification-action-link" onClick={markAllAsRead}>
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="notification-list">
                        {notifications.length === 0 ? (
                          <div className="notification-empty">
                            <BellOff size={24} style={{ color: 'var(--text-muted)' }} />
                            <span>No notifications yet</span>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              className={`notification-item${!notif.isRead ? ' unread' : ''}`}
                              onClick={() => handleNotifClick(notif)}
                            >
                              <div className={`notification-icon-wrapper ${notif.type}`}>
                                {getNotifIcon(notif.type)}
                              </div>
                              <div className="notification-content">
                                <div className="notification-title">{notif.title}</div>
                                <div className="notification-msg">{notif.message}</div>
                                <div className="notification-time">{formatTime(notif.createdAt)}</div>
                              </div>
                              <div className="notification-item-actions">
                                {!notif.isRead && (
                                  <button
                                    className="notification-btn read"
                                    title="Mark as read"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notif._id);
                                    }}
                                  >
                                    <Check size={12} />
                                  </button>
                                )}
                                <button
                                  className="notification-btn delete"
                                  title="Delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notif._id);
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="notification-footer">
                          <button
                            className="notification-action-link"
                            style={{ color: 'var(--accent-rose)' }}
                            onClick={clearAllNotifications}
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ padding: '7px 12px', fontSize: '0.75rem', gap: '5px' }}
                  title="Logout"
                >
                  <LogOut size={13} />
                  Exit
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/login" className="nav-link" onClick={close}>
                Login
              </Link>
              <Link
                to="/register"
                className="btn"
                style={{ padding: '8px 18px', fontSize: '0.78rem' }}
                onClick={close}
              >
                Register
              </Link>
            </div>
          )}

          <div className="nav-divider" />

          {/* Theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSystemTheme && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--surface-1)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                <Monitor size={12} />
                System
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
              className="btn btn-secondary"
              style={{ padding: '8px', width: '36px', height: '36px' }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
