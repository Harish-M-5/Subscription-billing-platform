import { useState, useMemo } from 'react';
import { Bell, CheckCheck, Trash2, Wifi, WifiOff } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { Badge, PageLoader, EmptyState, ConfirmDialog, Spinner } from '../../components/ui/UI';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { getNotificationMeta, personalizeForCustomer } from '../../utils/notificationMeta';

export default function PortalNotifications() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, connected, markRead, markAllRead, remove } = useNotifications();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const visible = useMemo(
    () => (unreadOnly ? notifications.filter((n) => !n.read) : notifications),
    [notifications, unreadOnly]
  );

  const handleMarkAll = async () => {
    setMarkingAll(true);
    await markAllRead();
    setMarkingAll(false);
  };

  const confirmDelete = async () => {
    await remove(deleteTarget._id);
    setDeleteTarget(null);
  };

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2 flex-wrap">
            Notifications
            {unreadCount > 0 && <Badge tone="blue">{unreadCount} unread</Badge>}
            <span title={connected ? 'Live updates connected' : 'Reconnecting…'}>
              {connected ? (
                <Wifi size={16} className="text-accent-500" />
              ) : (
                <WifiOff size={16} className="text-slate-400" />
              )}
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Payments, invoices, and subscription updates for your account — updated in real time.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            Unread only
          </label>
          <button className="btn-secondary" onClick={handleMarkAll} disabled={markingAll || unreadCount === 0}>
            {markingAll ? <Spinner /> : <><CheckCheck size={16} /> Mark all read</>}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading && notifications.length === 0 ? (
          <PageLoader />
        ) : visible.length === 0 ? (
          <EmptyState
            title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            icon={Bell}
            subtitle="Payment and subscription updates from your business will show up here instantly."
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map((n) => {
              const meta = getNotificationMeta(n.type);
              const Icon = meta.icon;
              const displayMessage = personalizeForCustomer(n.message, user?.fullName);
              return (
                <li
                  key={n._id}
                  className={`group flex items-start gap-3 px-4 py-4 transition animate-fadeIn ${!n.read ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''}`}
                >
                  <div className={`shrink-0 rounded-lg p-2 ${!n.read ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge tone={meta.tone}>{n.subject || meta.label}</Badge>
                    <p className="mt-1 text-sm">{displayMessage}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition">
                    {!n.read && (
                      <button className="text-xs font-semibold text-brand-600 hover:text-brand-700" onClick={() => markRead(n._id)}>
                        Mark read
                      </button>
                    )}
                    <button className="text-slate-400 hover:text-rose-600" title="Delete" onClick={() => setDeleteTarget(n)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Notification"
        message="This notification will be permanently removed."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
      />
    </DashboardShell>
  );
}
