import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { notificationApi, portalApi } from '../api/endpoints';
import { PERMISSIONS, hasPermission } from '../utils/permissions';
import { getNotificationMeta } from '../utils/notificationMeta';
import { getAuthItem } from '../utils/sessionAuth';

const NotificationContext = createContext(null);

// Business users and customers hit different REST endpoints for the same
// concept ("my notifications"); this picks the right set once per role so
// the rest of the provider doesn't need to branch on role everywhere.
function apiFor(role) {
  if (role === 'customer') {
    return {
      list: portalApi.notifications,
      markRead: portalApi.markNotificationRead,
      markAllRead: portalApi.markAllNotificationsRead,
      remove: portalApi.deleteNotification,
    };
  }
  return {
    list: notificationApi.list,
    markRead: notificationApi.markRead,
    markAllRead: notificationApi.markAllRead,
    remove: notificationApi.deleteNotification,
  };
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  const enabled = Boolean(
    user &&
      (user.role === 'customer'
        ? hasPermission(user, PERMISSIONS.PORTAL_VIEW)
        : hasPermission(user, PERMISSIONS.NOTIFICATIONS_VIEW))
  );
  const api = apiFor(user?.role);

  const refresh = useCallback(() => {
    if (!enabled) return;
    setLoading(true);
    api
      .list({ limit: 30 })
      .then((res) => {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, user?.role]);

  // Initial history load (and reload whenever the signed-in account changes).
  useEffect(() => {
    if (enabled) refresh();
    else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, user?.id]);

  // Live push: one socket per signed-in session. The server authenticates it
  // with the same JWT as REST calls and joins it to the right room(s) -
  // the client never tells the server which business/user it "is".
  useEffect(() => {
    const token = getAuthItem('token');
    if (!enabled || !token) return undefined;

    const socket = io({ auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('notification:new', (notification) => {
      setNotifications((list) => [notification, ...list].slice(0, 50));
      setUnreadCount((c) => c + 1);
      const meta = getNotificationMeta(notification.type);
      toast.info(`${meta.label}: ${notification.message}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, user?.id]);

  const markRead = useCallback(
    async (id) => {
      setNotifications((list) => list.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await api.markRead(id);
      } catch {
        refresh(); // reconcile on failure rather than leave optimistic state wrong
      }
    },
    [api, refresh]
  );

  const markAllRead = useCallback(async () => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await api.markAllRead();
    } catch {
      refresh();
    }
  }, [api, refresh]);

  const remove = useCallback(
    async (id) => {
      const target = notifications.find((n) => n._id === id);
      setNotifications((list) => list.filter((n) => n._id !== id));
      if (target && !target.read) setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await api.remove(id);
      } catch {
        refresh();
      }
    },
    [api, notifications, refresh]
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, connected, refresh, markRead, markAllRead, remove, enabled }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
