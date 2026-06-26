import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext();

const toastStyles = {
  success: {
    icon: CheckCircle2,
    iconColor: '#34d399',
    borderColor: '#34d399',
    label: 'Success',
  },
  error: {
    icon: AlertCircle,
    iconColor: '#fb7185',
    borderColor: '#fb7185',
    label: 'Error',
  },
  info: {
    icon: Info,
    iconColor: '#22d3ee',
    borderColor: '#22d3ee',
    label: 'Info',
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.success;
          const Icon  = style.icon;
          return (
            <div
              key={toast.id}
              className={`toast toast-${toast.type}`}
              onClick={() => removeToast(toast.id)}
              style={{ cursor: 'pointer', borderLeftColor: style.borderColor }}
              role="alert"
            >
              <Icon size={18} style={{ color: style.iconColor, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '0.88rem' }}>{toast.message}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                  padding: '2px', borderRadius: '4px',
                  flexShrink: 0,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
