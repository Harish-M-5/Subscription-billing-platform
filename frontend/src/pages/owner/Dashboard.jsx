import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock, IndianRupee, Wallet, Activity, Building2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DashboardShell from '../../components/layout/DashboardShell';
import { StatCard, PageLoader, Badge, statusTone, EmptyState } from '../../components/ui/UI';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import StaggerGrid from '../../components/ui/StaggerGrid';
import { dashboardApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { business } = useAuth();

  useEffect(() => {
    Promise.all([dashboardApi.summary(), dashboardApi.reports({ range: 'monthly' })])
      .then(([s, r]) => {
        setData(s.data);
        setSeries(r.data.revenueSeries.map((d) => ({ name: d._id, revenue: d.total })));
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (<DashboardShell><PageLoader /></DashboardShell>);
  if (!data) return (<DashboardShell><EmptyState title="Could not load dashboard" /></DashboardShell>);

  const { summary, recentPayments, recentActivity } = data;

  return (
    <DashboardShell>
      {business && (
        <div className="card p-5 mb-6 flex items-center gap-4 bg-gradient-to-r from-brand-500 to-accent-500 text-white border-0">
          <div className="h-14 w-14 shrink-0 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center overflow-hidden">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.name} className="h-full w-full object-cover" />
            ) : (
              <Building2 size={26} />
            )}
          </div>
          <div>
            <p className="font-display text-xl font-bold">{business.name}</p>
            <p className="text-sm text-white/80">{business.type}{business.customType ? ` · ${business.customType}` : ''} · {business.businessId}</p>
          </div>
        </div>
      )}

      <h1 className="font-display text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Here's what's happening with your business today.</p>

      <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={<AnimatedCounter value={summary.totalCustomers} />} icon={Users} tone="brand" />
        <StatCard label="Active Customers" value={<AnimatedCounter value={summary.activeCustomers} />} icon={UserCheck} tone="accent" />
        <StatCard label="Expired" value={<AnimatedCounter value={summary.expiredCustomers} />} icon={UserX} tone="rose" />
        <StatCard label="Expiring Soon" value={<AnimatedCounter value={summary.expiringSoon} />} icon={Clock} tone="amber" />
      </StaggerGrid>

      <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <StatCard label="Today's Revenue" value={<AnimatedCounter value={summary.todayRevenue} prefix="₹" />} icon={IndianRupee} tone="brand" />
        <StatCard label="Monthly Revenue" value={<AnimatedCounter value={summary.monthlyRevenue} prefix="₹" />} icon={Wallet} tone="accent" />
        <StatCard
          label="Pending Payments"
          value={<AnimatedCounter value={summary.pendingPayments.total} prefix="₹" />}
          sub={`${summary.pendingPayments.count} pending`}
          icon={Activity}
          tone="amber"
        />
      </StaggerGrid>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display font-bold mb-4">Revenue Trend</h2>
          {series.length === 0 ? (
            <EmptyState title="No revenue data yet" subtitle="Recorded payments will appear here." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3d5cff" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-display font-bold mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((a) => (
                <li key={a._id} className="text-sm">
                  <p className="font-medium">{a.action.replace('.', ' ')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {a.actor?.fullName} · {new Date(a.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-5 mt-6">
        <h2 className="font-display font-bold mb-4">Recent Payments</h2>
        {recentPayments.length === 0 ? (
          <EmptyState title="No payments recorded yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 font-medium">Customer</th>
                  <th className="py-2 font-medium">Amount</th>
                  <th className="py-2 font-medium">Method</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr key={p._id} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="py-2.5">{p.customer?.name} <span className="text-xs text-slate-400">({p.customer?.customerId})</span></td>
                    <td className="py-2.5">₹{p.amount.toLocaleString()}</td>
                    <td className="py-2.5 capitalize">{p.method.replace('_', ' ')}</td>
                    <td className="py-2.5"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</td>
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
