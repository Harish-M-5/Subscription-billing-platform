import { useEffect, useState } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import { PageLoader, EmptyState, Badge, statusTone } from '../../components/ui/UI';
import { portalApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

export default function PortalSubscription() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    portalApi
      .subscriptions()
      .then((res) => setSubs(res.data.subscriptions))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load subscriptions.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-1">My Subscription</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Full history of your plans with this business.</p>

      {loading ? (
        <PageLoader />
      ) : subs.length === 0 ? (
        <EmptyState title="No subscriptions yet" />
      ) : (
        <div className="space-y-4">
          {subs.map((s) => (
            <div key={s._id} className="card p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display font-bold">{s.plan?.name}</p>
                <p className="text-sm text-slate-500">{new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">₹{s.priceAtSubscription}</span>
                <Badge tone={statusTone(s.status)}>{s.status.replace('_', ' ')}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
