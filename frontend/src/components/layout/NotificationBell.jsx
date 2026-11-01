import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, Inbox, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { getNotificationMeta, personalizeForCustomer } from '../../utils/notificationMeta';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const TONE_DOT = {
  slate: 'bg-slate-400', green: 'bg-emerald-500', amber: 'bg-amber-500',
  red: 'bg-rose-500', blue: 'bg-brand-500', purple: 'bg-violet-500', orange: 'bg-orange-500',
};

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, connected, enabled, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!enabled) return null;

  const isCustomer = user?.role === 'customer';
  const viewAllPath = isCustomer ? '/portal/notifications' : '/app/notifications';
  const preview = notifications.slice(0, 6);

  const handleItemClick = (n) => {
    if (!n.read) markRead(n._id);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2.5 text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Notifications"
        title={connected ? 'Live' : 'Reconnecting…'}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white animate-popIn">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          className="absolute right-0 mt-2 w-[22rem] max-w-[90vw] card p-0 z-50 origin-top-right overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm">Notifications</h3>
              {connected ? (
                <Wifi size={12} className="text-accent-500" />
              ) : (
                <WifiOff size={12} className="text-slate-400" />
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && preview.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">Loading…</div>
            ) : preview.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                <Inbox size={28} className="mb-2 opacity-50" />
                <p className="text-sm">You're all caught up</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {preview.map((n) => {
                  const meta = getNotificationMeta(n.type);
                  const Icon = meta.icon;
                  const displayMessage = isCustomer ? personalizeForCustomer(n.message, user?.fullName) : n.message;
                  return (
                    <li
                      key={n._id}
                      onClick={() => handleItemClick(n)}
                      className={`flex items-start gap-2.5 px-4 py-3 cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        !n.read ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                      }`}
                    >
                      <div className={`shrink-0 mt-0.5 rounded-lg p-1.5 bg-slate-100 dark:bg-slate-800`}>
                        <Icon size={14} className="text-slate-600 dark:text-slate-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{n.subject || meta.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{displayMessage}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${TONE_DOT[meta.tone] || TONE_DOT.slate}`} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <button
            onClick={() => { setOpen(false); navigate(viewAllPath); }}
            className="w-full border-t border-slate-100 dark:border-slate-800 py-2.5 text-center text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
          >
            View all notifications
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
