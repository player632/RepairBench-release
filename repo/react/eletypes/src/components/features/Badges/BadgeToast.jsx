import React, { useState, useEffect, useCallback } from "react";

const TOAST_DURATION = 4000;

const BadgeToast = ({ theme }) => {
  const [toasts, setToasts] = useState([]);

  const handleBadgeEvent = useCallback((e) => {
    const { badges } = e.detail;
    if (!badges || badges.length === 0) return;
    const newToasts = badges.map((b, i) => ({
      id: `${b.id}-${Date.now()}-${i}`,
      badge: b,
    }));
    setToasts((prev) => [...prev, ...newToasts]);
  }, []);

  useEffect(() => {
    window.addEventListener("badge-earned", handleBadgeEvent);
    return () => window.removeEventListener("badge-earned", handleBadgeEvent);
  }, [handleBadgeEvent]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (!theme || toasts.length === 0) return null;

  return (
    <div className="badge-toast-container">
      {toasts.map((toast, idx) => (
        <div
          key={toast.id}
          className="badge-toast"
          style={{
            background: theme.background,
            border: `1px solid ${theme.stats}50`,
            color: theme.text,
            animationDelay: `${idx * 100}ms`,
          }}
        >
          <span className="badge-toast-icon">{toast.badge.icon}</span>
          <span className="badge-toast-text" style={{ color: theme.stats }}>
            {toast.badge.displayName}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BadgeToast;
