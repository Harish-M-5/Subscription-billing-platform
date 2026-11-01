import { useEffect, useState } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import { StatCard, PageLoader, EmptyState, Badge, statusTone } from '../../components/ui/UI';
import { Layers, Calendar, CreditCard, FileText, Building2, CalendarClock } from 'lucide-react';
import { portalApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

export default function PortalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    portalApi
      .dashboard()
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (<DashboardShell><PageLoader /></DashboardShell>);
  if (!data) return (<DashboardShell><EmptyState title="Could not load your dashboard" /></DashboardShell>);

  const { customer, payments, invoices } = data;
  const sub = customer.currentSubscription;
  const openInvoice = sub ? invoices.find((inv) => inv.subscription === sub._id && inv.status !== 'paid') : null;

  return (
    <DashboardShell>
      <div className="card p-5 mb-6 flex items-center gap-4 bg-gradient-to-r from-brand-500 to-accent-500 text-white border-0">
        <div className="h-14 w-14 shrink-0 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center overflow-hidden">
          {customer.business?.logoUrl ? (
            <img src={customer.business.logoUrl} alt={customer.business.name} className="h-full w-full object-cover" />
          ) : (
            <Building2 size={26} />
          )}
        </div>
        <div>
          <p className="font-display text-xl font-bold">{customer.business?.name}</p>
          <p className="text-sm text-white/80">{customer.business?.type}{customer.business?.customType ? ` · ${customer.business.customType}` : ''}</p>
        </div>
      </div>

      <h1 className="font-display text-2xl font-bold mb-1">Welcome back, {customer.name.split(' ')[0]}</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Customer ID: <span className="font-mono">{customer.customerId}</span></p>

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <StatCard label="Plan" value={sub?.plan?.name || 'None'} icon={Layers} tone="brand" />
        <StatCard
          label="Status"
          value={<Badge tone={statusTone(customer.subscriptionStatus)}>{customer.subscriptionStatus.replace('_', ' ')}</Badge>}
          icon={Calendar}
          tone="accent"
        />
        <StatCard label="Renews / Expires" value={sub ? new Date(sub.endDate).toLocaleDateString() : '—'} icon={Calendar} tone="amber" />
      </div>

      {openInvoice && (
        <div className="card p-5 mb-6 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                {openInvoice.status === 'partial' ? 'Balance remaining on your subscription' : 'Payment pending on your subscription'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Invoice {openInvoice.invoiceNumber} — ₹{openInvoice.amountPaid.toLocaleString()} paid of ₹{openInvoice.amount.toLocaleString()}
              </p>
            </div>
            <p className="text-2xl font-display font-bold text-rose-600 dark:text-rose-400">₹{openInvoice.balanceDue.toLocaleString()}</p>
          </div>
          {openInvoice.installmentPlan?.enabled && (
            <div className="mt-3 pt-3 border-t border-rose-200/60 dark:border-rose-900/50 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <CalendarClock size={14} className="text-amber-500 shrink-0" />
              Next payment of ₹{openInvoice.installmentPlan.amount.toLocaleString()} due{' '}
              {new Date(openInvoice.installmentPlan.nextDueDate).toLocaleDateString()} ({openInvoice.installmentPlan.frequency.replace('_', ' ')})
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-brand-500" />
            <h2 className="font-display font-bold">Recent Payments</h2>
          </div>
          {payments.length === 0 ? (
            <EmptyState title="No payments yet" />
          ) : (
            <ul className="space-y-3">
              {payments.map((p) => (
                <li key={p._id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">₹{p.amount.toLocaleString()} <span className="text-xs text-slate-400 capitalize">({p.method.replace('_', ' ')})</span></p>
                    <p className="text-xs text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</p>
                  </div>
                  <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-brand-500" />
            <h2 className="font-display font-bold">Recent Invoices</h2>
          </div>
          {invoices.length === 0 ? (
            <EmptyState title="No invoices yet" />
          ) : (
            <ul className="space-y-3">
              {invoices.map((inv) => (
                <li key={inv._id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium font-mono text-xs">{inv.invoiceNumber}</p>
                    <p className="text-xs text-slate-400">{inv.planName} · ₹{inv.amount.toLocaleString()}</p>
                  </div>
                  <Badge tone={statusTone(inv.status)}>{inv.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
