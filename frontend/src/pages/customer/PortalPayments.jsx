import { useEffect, useState } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import { PageLoader, EmptyState, Badge, statusTone } from '../../components/ui/UI';
import { portalApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

export default function PortalPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    portalApi
      .payments()
      .then((res) => setPayments(res.data.payments))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load payments.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-1">Payment History</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Every payment you've made to this business.</p>

      <div className="card overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : payments.length === 0 ? (
          <EmptyState title="No payments yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Method</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="py-3 px-4 font-semibold">₹{p.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 capitalize">{p.method.replace('_', ' ')}</td>
                    <td className="py-3 px-4"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                    <td className="py-3 px-4 text-slate-500">{new Date(p.paidAt).toLocaleDateString()}</td>
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
