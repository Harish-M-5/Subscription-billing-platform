import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DashboardShell from '../../components/layout/DashboardShell';
import { StatCard, PageLoader, EmptyState } from '../../components/ui/UI';
import { Users, UserX, Clock } from 'lucide-react';
import { dashboardApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

export default function Reports() {
  const [range, setRange] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    dashboardApi
      .reports({ range })
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load reports.'))
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Reports</h1>
          <p className="text-slate-500 dark:text-slate-400">Revenue and customer trends over time.</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {['daily', 'monthly', 'yearly'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 text-sm font-medium capitalize transition ${range === r ? 'bg-brand-500 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <StatCard label="Active Customers" value={data.activeCustomers} icon={Users} tone="brand" />
            <StatCard label="Expired Customers" value={data.expiredCustomers} icon={UserX} tone="rose" />
            <StatCard label="Pending Payments" value={data.pendingPayments} icon={Clock} tone="amber" />
          </div>
          <div className="card p-5">
            <h2 className="font-display font-bold mb-4 capitalize">{range} Revenue</h2>
            {data.revenueSeries.length === 0 ? (
              <EmptyState title="No revenue in this period" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.revenueSeries.map((d) => ({ name: d._id, revenue: d.total }))}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3d5cff" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
