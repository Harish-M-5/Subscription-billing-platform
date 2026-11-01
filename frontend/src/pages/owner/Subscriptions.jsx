import { useEffect, useState } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import { Badge, statusTone, PageLoader, EmptyState } from '../../components/ui/UI';
import { subscriptionApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    subscriptionApi
      .list({ status, limit: 50 })
      .then((res) => setSubs(res.data.subscriptions))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load subscriptions.'))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Subscriptions</h1>
          <p className="text-slate-500 dark:text-slate-400">All customer subscriptions across your business.</p>
        </div>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
          <option value="upgraded">Upgraded</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : subs.length === 0 ? (
          <EmptyState title="No subscriptions found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Plan</th>
                  <th className="py-3 px-4 font-medium">Price</th>
                  <th className="py-3 px-4 font-medium">Period</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s._id} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="py-3 px-4">
                      <p className="font-medium">{s.customer?.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{s.customer?.customerId}</p>
                    </td>
                    <td className="py-3 px-4">{s.plan?.name}</td>
                    <td className="py-3 px-4">₹{s.priceAtSubscription}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4"><Badge tone={statusTone(s.status)}>{s.status.replace('_', ' ')}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
