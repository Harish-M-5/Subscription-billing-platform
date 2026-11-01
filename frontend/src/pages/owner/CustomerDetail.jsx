import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Layers, CreditCard, RefreshCw, ArrowUpCircle, XCircle, Pencil, Trash2, Download, Wallet, PiggyBank, Receipt, CalendarClock } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { Badge, statusTone, PageLoader, EmptyState, Modal, Spinner, ConfirmDialog, MiniInfoCard } from '../../components/ui/UI';
import StepIndicator from '../../components/ui/StepIndicator';
import { customerApi, planApi, subscriptionApi, paymentApi, invoiceApi } from '../../api/endpoints';
import { openOrDownloadBlob } from '../../utils/download';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';

const CYCLE_DAYS = { monthly: 30, quarterly: 91, half_yearly: 182, yearly: 365 };

function toDateInput(d) {
  return new Date(d).toISOString().slice(0, 10);
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = hasPermission(user, PERMISSIONS.CUSTOMER_EDIT);
  const canDelete = hasPermission(user, PERMISSIONS.CUSTOMER_DELETE);
  const canCreateSub = hasPermission(user, PERMISSIONS.SUBSCRIPTION_CREATE);
  const canUpgrade = hasPermission(user, PERMISSIONS.SUBSCRIPTION_UPGRADE);
  const canCancel = hasPermission(user, PERMISSIONS.SUBSCRIPTION_CANCEL);
  const [customer, setCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showInstallmentPlan, setShowInstallmentPlan] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    customerApi
      .get(id)
      .then((res) => {
        setCustomer(res.data.customer);
        setHistory(res.data.subscriptionHistory);
        setCurrentInvoice(res.data.currentInvoice);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load customer.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const doAction = async (fn, successMsg) => {
    try {
      await fn();
      toast.success(successMsg);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await customerApi.remove(id);
      toast.success('Customer deleted.');
      navigate('/app/customers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer.');
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) return (<DashboardShell><PageLoader /></DashboardShell>);
  if (!customer) return (<DashboardShell><EmptyState title="Customer not found" /></DashboardShell>);

  const activeSub = customer.currentSubscription;

  return (
    <DashboardShell breadcrumbLabel={customer.name}>
      <Link to="/app/customers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 mb-4">
        <ArrowLeft size={16} /> Back to customers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-xl font-bold">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{customer.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-mono text-sm">{customer.customerId}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <button className="btn-secondary" onClick={() => setShowEdit(true)}>
              <Pencil size={16} /> Edit
            </button>
          )}
          {!activeSub && canCreateSub && (
            <button className="btn-primary" onClick={() => setShowSubscribe(true)}>
              <Layers size={16} /> Start Subscription
            </button>
          )}
          {activeSub && currentInvoice && (
            <button className="btn-secondary" onClick={() => setShowPay(true)}>
              <CreditCard size={16} /> Record Payment
            </button>
          )}
          {canDelete && (
            <button className="btn-danger" onClick={() => setShowDelete(true)}>
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h2 className="font-display font-bold mb-3">Contact</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{customer.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{customer.phone}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Address</dt><dd className="text-right">{customer.address || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Joined</dt><dd>{new Date(customer.joinDate).toLocaleDateString()}</dd></div>
          </dl>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-display font-bold">Current Subscription</h2>
            <div className="flex items-center gap-2">
              <Badge tone={statusTone(customer.subscriptionStatus)}>{customer.subscriptionStatus.replace('_', ' ')}</Badge>
              {currentInvoice && <Badge tone={statusTone(currentInvoice.status)}>{currentInvoice.status === 'partial' ? 'Partially Paid' : currentInvoice.status}</Badge>}
            </div>
          </div>
          {activeSub ? (
            <div className="text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 mb-4">
                <div>
                  <p className="text-slate-500 text-xs">Plan</p>
                  <p className="font-display font-bold">{activeSub.plan?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs">Renews / Expires</p>
                  <p className="font-semibold">{new Date(activeSub.endDate).toLocaleDateString()}</p>
                </div>
              </div>

              {currentInvoice ? (
                <div className="grid sm:grid-cols-3 gap-3">
                  <MiniInfoCard eyebrow="Plan Amount" value={`₹${currentInvoice.amount.toLocaleString()}`} icon={Wallet} tone="brand" />
                  <MiniInfoCard eyebrow="Amount Paid" value={`₹${currentInvoice.amountPaid.toLocaleString()}`} icon={PiggyBank} tone="accent" />
                  <MiniInfoCard
                    eyebrow="Balance Due"
                    value={`₹${currentInvoice.balanceDue.toLocaleString()}`}
                    icon={Receipt}
                    tone={currentInvoice.balanceDue > 0 ? 'rose' : 'accent'}
                    corner={currentInvoice.invoiceNumber.replace('INV-', '')}
                  />
                </div>
              ) : (
                <div className="grid sm:grid-cols-3 gap-3">
                  <MiniInfoCard eyebrow="Plan Amount" value={`₹${activeSub.priceAtSubscription.toLocaleString()}`} icon={Wallet} tone="brand" />
                </div>
              )}

              {currentInvoice && (
                <div className="mt-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                  {currentInvoice.installmentPlan?.enabled ? (
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="icon-circle h-8 w-8 bg-pastel-amber dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                        <CalendarClock size={15} />
                      </div>
                      <div>
                        <p className="font-semibold">₹{currentInvoice.installmentPlan.amount.toLocaleString()} / {currentInvoice.installmentPlan.frequency.replace('_', ' ')}</p>
                        <p className="text-xs text-slate-500">Next reminder: {new Date(currentInvoice.installmentPlan.nextDueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No recurring payment plan set up for this balance.</p>
                  )}
                  <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => setShowInstallmentPlan(true)}>
                    <CalendarClock size={13} /> {currentInvoice.installmentPlan?.enabled ? 'Edit Plan' : 'Set Up Payment Plan'}
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-4 flex-wrap">
                <button className="btn-secondary" onClick={() => doAction(() => subscriptionApi.renew(activeSub._id), 'Subscription renewed.')}>
                  <RefreshCw size={15} /> Renew
                </button>
                {canUpgrade && <UpgradeButton subscriptionId={activeSub._id} currentPlanId={activeSub.plan?._id} onDone={load} />}
                {canCancel && (
                  <button className="btn-danger" onClick={() => setCancelTarget(activeSub)}>
                    <XCircle size={15} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No active subscription"
              subtitle={canCreateSub ? 'Start a new subscription to begin billing this customer.' : 'Ask an owner or manager to start a subscription for this customer.'}
            />
          )}
        </div>
      </div>

      <div className="card p-5 mt-4 overflow-hidden">
        <h2 className="font-display font-bold mb-4">Subscription History</h2>
        {history.length === 0 ? (
          <EmptyState title="No subscription history" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 font-medium">Plan</th>
                  <th className="py-2 font-medium">Amount</th>
                  <th className="py-2 font-medium">Paid / Balance</th>
                  <th className="py-2 font-medium">Period</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h._id} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="py-2.5">{h.plan?.name}</td>
                    <td className="py-2.5">₹{h.priceAtSubscription.toLocaleString()}</td>
                    <td className="py-2.5 text-xs">
                      {h.invoice ? (
                        <span>
                          <span className="text-accent-600 dark:text-accent-400">₹{h.invoice.amountPaid.toLocaleString()} paid</span>
                          {h.invoice.balanceDue > 0 && <span className="text-rose-500"> · ₹{h.invoice.balanceDue.toLocaleString()} due</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 text-slate-500 whitespace-nowrap">{new Date(h.startDate).toLocaleDateString()} – {new Date(h.endDate).toLocaleDateString()}</td>
                    <td className="py-2.5">
                      <div className="flex flex-col gap-1">
                        <Badge tone={statusTone(h.status)}>{h.status}</Badge>
                        {h.invoice && h.invoice.status !== 'paid' && (
                          <Badge tone={statusTone(h.invoice.status)}>{h.invoice.status === 'partial' ? 'Partially Paid' : 'Unpaid'}</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} customerId={customer._id} onDone={() => { setShowSubscribe(false); load(); }} />
      <PaymentModal open={showPay} onClose={() => setShowPay(false)} customer={customer} subscription={activeSub} invoice={currentInvoice} onDone={() => { setShowPay(false); load(); }} />
      <InstallmentPlanModal
        open={showInstallmentPlan}
        onClose={() => setShowInstallmentPlan(false)}
        invoice={currentInvoice}
        onDone={() => { setShowInstallmentPlan(false); load(); }}
      />
      <EditCustomerModal open={showEdit} onClose={() => setShowEdit(false)} customer={customer} onSaved={() => { setShowEdit(false); load(); }} />
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Customer"
        message={`Delete ${customer.name}? Their account will be deactivated and they will no longer appear in your customer list. Historical payments and invoices are preserved for your records.`}
        confirmLabel="Delete Customer"
        danger
        loading={deleting}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Subscription"
        message="This will immediately cancel the customer's active subscription. This cannot be undone."
        confirmLabel="Cancel Subscription"
        danger
        onConfirm={() => doAction(() => subscriptionApi.cancel(cancelTarget._id, 'Cancelled by staff'), 'Subscription cancelled.').then(() => setCancelTarget(null))}
      />
    </DashboardShell>
  );
}

function EditCustomerModal({ open, onClose, customer, onSaved }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (customer) setForm({ name: customer.name || '', phone: customer.phone || '', address: customer.address || '' });
  }, [customer, open]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await customerApi.update(customer._id, form);
      toast.success('Customer updated.');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Customer">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input disabled className="input opacity-60" value={customer?.email || ''} />
          <p className="mt-1 text-xs text-slate-400">Email is permanent and can't be changed.</p>
        </div>
        <div>
          <label className="label">Phone</label>
          <input required className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner /> : 'Save Changes'}
        </button>
      </form>
    </Modal>
  );
}

function UpgradeButton({ subscriptionId, currentPlanId, onDone }) {
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const openModal = () => {
    setOpen(true);
    planApi.list().then((res) => setPlans(res.data.plans.filter((p) => p._id !== currentPlanId)));
  };

  const submit = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      await subscriptionApi.upgrade(subscriptionId, planId);
      toast.success('Subscription upgraded.');
      setOpen(false);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn-secondary" onClick={openModal}>
        <ArrowUpCircle size={15} /> Upgrade
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Upgrade Plan"
        footer={<button className="btn-primary" onClick={submit} disabled={loading || !planId}>{loading ? <Spinner /> : 'Upgrade'}</button>}
      >
        <select className="input" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          <option value="">Select a plan…</option>
          {plans.map((p) => (
            <option key={p._id} value={p._id}>{p.name} — ₹{p.price} / {p.billingCycle.replace('_', ' ')}</option>
          ))}
        </select>
      </Modal>
    </>
  );
}

function SubscribeModal({ open, onClose, customerId, onDone }) {
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState('');
  const [customizeDates, setCustomizeDates] = useState(false);
  const [startDate, setStartDate] = useState(toDateInput(new Date()));
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      planApi.list().then((res) => setPlans(res.data.plans));
      setCustomizeDates(false);
      setStartDate(toDateInput(new Date()));
      setEndDate('');
    }
  }, [open]);

  const selectedPlan = plans.find((p) => p._id === planId);

  // Live preview of the auto-calculated end date for the chosen plan's cycle,
  // used as the default and shown so staff know what "no customization" means.
  const autoEndDate = (() => {
    if (!selectedPlan) return '';
    const start = new Date(startDate || new Date());
    start.setDate(start.getDate() + (CYCLE_DAYS[selectedPlan.billingCycle] || 30));
    return toDateInput(start);
  })();

  const submit = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const payload = { customerId, planId };
      if (customizeDates) {
        payload.startDate = startDate;
        payload.endDate = endDate || autoEndDate;
      }
      await subscriptionApi.create(payload);
      toast.success('Subscription started.');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start Subscription"
      footer={<button className="btn-primary" onClick={submit} disabled={loading || !planId}>{loading ? <Spinner /> : 'Start Subscription'}</button>}
    >
      {plans.length === 0 ? (
        <EmptyState title="No plans yet" subtitle="Create a subscription plan first." />
      ) : (
        <div className="space-y-4">
          <StepIndicator
            steps={[{ label: 'Choose a Plan' }, { label: 'Set Dates' }, { label: 'Confirm & Start' }]}
            currentStep={!planId ? 0 : 1}
          />
          <div className="space-y-2">
            {plans.map((p) => (
              <label key={p._id} className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${planId === p._id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-slate-200 dark:border-slate-700'}`}>
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.billingCycle.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">₹{p.price}</span>
                  <input type="radio" name="plan" checked={planId === p._id} onChange={() => setPlanId(p._id)} />
                </div>
              </label>
            ))}
          </div>

          {planId && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={customizeDates} onChange={(e) => setCustomizeDates(e.target.checked)} />
                Customize join date &amp; end date
              </label>
              {customizeDates ? (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="label">Join Date</label>
                    <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input type="date" className="input" min={startDate} value={endDate || autoEndDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Defaults to today through {autoEndDate ? new Date(autoEndDate).toLocaleDateString() : '—'} ({selectedPlan?.billingCycle.replace('_', ' ')}).
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function PaymentModal({ open, onClose, customer, subscription, invoice, onDone }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [failing, setFailing] = useState(false);
  const [result, setResult] = useState(null); // { payment, invoice }
  const [failed, setFailed] = useState(null); // { payment }
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setAmount(invoice ? invoice.balanceDue : '');
      setResult(null);
      setFailed(null);
    }
  }, [invoice, open]);

  const balanceDue = invoice?.balanceDue ?? subscription?.priceAtSubscription ?? 0;

  const submit = async (e) => {
    e.preventDefault();
    const numeric = Number(amount);
    if (numeric > balanceDue + 0.01) {
      toast.error(`Amount exceeds the balance due of ₹${balanceDue.toLocaleString()}.`);
      return;
    }
    setLoading(true);
    try {
      const res = await paymentApi.record({
        customerId: customer._id,
        subscriptionId: subscription._id,
        invoiceId: invoice?._id,
        amount: numeric,
        method,
        notes,
      });
      toast.success('Payment recorded.');
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  // Logs a declined/bounced attempt as its own transaction (never touches the
  // invoice balance) and fires the "payment failed" notification - useful
  // when a card is declined or a UPI request bounces at the front desk.
  const submitFailed = async () => {
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) {
      toast.error('Enter the amount that was attempted.');
      return;
    }
    setFailing(true);
    try {
      const res = await paymentApi.record({
        customerId: customer._id,
        subscriptionId: subscription._id,
        invoiceId: invoice?._id,
        amount: numeric,
        method,
        notes,
        markAsFailed: true,
        failureReason: notes || undefined,
      });
      setFailed(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log the failed attempt.');
    } finally {
      setFailing(false);
    }
  };

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      const res = await invoiceApi.downloadPdf(result.invoice._id);
      openOrDownloadBlob(res.data, `${result.invoice.invoiceNumber}.pdf`);
    } catch (err) {
      toast.error('Failed to generate the invoice PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (failed) {
    return (
      <Modal open={open} onClose={() => { setFailed(null); onDone(); }} title="Payment Failed">
        <div className="text-center py-4">
          <div className="mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
            <XCircle size={24} />
          </div>
          <p className="font-semibold">Payment attempt of ₹{failed.payment.amount.toLocaleString()} marked as failed.</p>
          <p className="text-sm text-slate-500 mt-1">The customer and business have been notified. No balance was deducted.</p>
          <button className="btn-secondary mt-5" onClick={() => { setFailed(null); onDone(); }}>Close</button>
        </div>
      </Modal>
    );
  }

  if (result) {
    const isFullyPaid = result.invoice?.status === 'paid';
    return (
      <Modal open={open} onClose={() => { setResult(null); onDone(); }} title="Payment Recorded">
        <div className="text-center py-4">
          <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4 ${isFullyPaid ? 'bg-accent-100 dark:bg-accent-950 text-accent-600 dark:text-accent-400' : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'}`}>
            <CreditCard size={24} />
          </div>
          <p className="font-semibold">Payment of ₹{result.payment.amount.toLocaleString()} recorded.</p>
          {result.invoice ? (
            <>
              <Badge tone={statusTone(result.invoice.status)}>{isFullyPaid ? 'Paid in Full' : 'Partially Paid'}</Badge>

              <div className="mt-4 text-left max-w-xs mx-auto rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="icon-circle h-8 w-8 bg-pastel-blue dark:bg-brand-950 text-brand-600 dark:text-brand-300">
                      <CreditCard size={14} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Last Payment</p>
                      <p className="text-xs font-semibold uppercase">{result.payment.method.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <p className="font-display font-bold text-sm">₹{result.payment.amount.toLocaleString()}</p>
                </div>
                {!isFullyPaid && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <p className="text-xs text-slate-500">Balance Due</p>
                    <p className="font-display font-bold text-sm text-rose-600 dark:text-rose-400">₹{result.invoice.balanceDue.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {!isFullyPaid && (
                <p className="text-xs text-slate-500 mt-3">The remaining balance stays open — record another payment anytime to settle it.</p>
              )}
              <button className="btn-primary mt-5" onClick={downloadInvoice} disabled={downloading}>
                {downloading ? <Spinner /> : <><Download size={16} /> Download Invoice PDF</>}
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-500 mt-1">No invoice was linked to this payment.</p>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Payment">
      {invoice && (
        <div className="mb-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-sm grid grid-cols-3 gap-2">
          <div><p className="text-slate-500 text-xs">Plan Amount</p><p className="font-semibold">₹{invoice.amount.toLocaleString()}</p></div>
          <div><p className="text-slate-500 text-xs">Already Paid</p><p className="font-semibold text-accent-600">₹{invoice.amountPaid.toLocaleString()}</p></div>
          <div><p className="text-slate-500 text-xs">Balance Due</p><p className="font-semibold text-rose-600">₹{invoice.balanceDue.toLocaleString()}</p></div>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Amount to Collect (₹)</label>
          <input
            type="number"
            required
            min={0.01}
            step="0.01"
            max={balanceDue || undefined}
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">
            Enter the full balance for a complete payment, or less for a partial payment — the remaining balance stays open on the invoice.
          </p>
        </div>
        <div>
          <label className="label">Payment Method</label>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. card declined, UPI timeout…" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1" disabled={loading || failing}>
            {loading ? <Spinner /> : 'Record Payment'}
          </button>
          <button
            type="button"
            className="btn-secondary text-rose-600 dark:text-rose-400"
            disabled={loading || failing}
            onClick={submitFailed}
            title="Log a declined or bounced payment attempt"
          >
            {failing ? <Spinner /> : 'Mark as Failed'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function InstallmentPlanModal({ open, onClose, invoice, onDone }) {
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDueDate, setNextDueDate] = useState(toDateInput(new Date()));
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open && invoice) {
      const plan = invoice.installmentPlan;
      setAmount(plan?.enabled ? plan.amount : Math.min(invoice.balanceDue, 100) || '');
      setFrequency(plan?.frequency || 'monthly');
      setNextDueDate(plan?.nextDueDate ? toDateInput(plan.nextDueDate) : toDateInput(new Date()));
    }
  }, [open, invoice]);

  const submit = async (e) => {
    e.preventDefault();
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) {
      toast.error('Enter a valid installment amount.');
      return;
    }
    setLoading(true);
    try {
      await invoiceApi.setInstallmentPlan(invoice._id, { enabled: true, amount: numeric, frequency, nextDueDate });
      toast.success('Payment plan saved. Reminders will fire automatically on each due date.');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save the payment plan.');
    } finally {
      setLoading(false);
    }
  };

  const cancelPlan = async () => {
    setCancelling(true);
    try {
      await invoiceApi.setInstallmentPlan(invoice._id, { enabled: false });
      toast.success('Payment plan cancelled.');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel the payment plan.');
    } finally {
      setCancelling(false);
    }
  };

  if (!invoice) return null;

  return (
    <Modal open={open} onClose={onClose} title="Recurring Payment Plan">
      <p className="text-xs text-slate-500 mb-4">
        Set a recurring amount and due date (monthly, quarterly, half-yearly or yearly) for this customer's
        remaining balance of ₹{invoice.balanceDue.toLocaleString()}. A notification fires automatically — to
        both your Notification Center and the customer's own portal — every time a due date arrives, reminding
        you to collect that installment.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Installment Amount (₹)</label>
          <input type="number" required min={1} max={invoice.balanceDue} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Frequency</label>
            <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="half_yearly">Half-Yearly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="label">Next Due Date</label>
            <input type="date" className="input" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1" disabled={loading || cancelling}>
            {loading ? <Spinner /> : 'Save Payment Plan'}
          </button>
          {invoice.installmentPlan?.enabled && (
            <button type="button" className="btn-secondary text-rose-600 dark:text-rose-400" disabled={loading || cancelling} onClick={cancelPlan}>
              {cancelling ? <Spinner /> : 'Cancel Plan'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
