import { useEffect, useState } from 'react';
import { Plus, Pencil, Ban, CheckCircle2, Store, Layers, Crown, Gem } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { PageLoader, EmptyState, Modal, Spinner, Badge } from '../../components/ui/UI';
import { planApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

// Cycles through a small set of pastel panel + icon combinations so plan
// cards read as distinct "products" at a glance, mirroring the reference
// screenshot's illustrated license card.
const PLAN_VISUALS = [
  { icon: Store, panel: 'bg-pastel-blue', iconColor: 'text-brand-600' },
  { icon: Layers, panel: 'bg-pastel-purple', iconColor: 'text-violet-600' },
  { icon: Crown, panel: 'bg-pastel-amber', iconColor: 'text-amber-600' },
  { icon: Gem, panel: 'bg-pastel-green', iconColor: 'text-accent-600' },
];

const CYCLES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half-Yearly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalPlan, setModalPlan] = useState(null); // null = closed, {} = new, {...} = edit
  const toast = useToast();

  const load = () => {
    setLoading(true);
    planApi
      .list({ includeInactive: true })
      .then((res) => setPlans(res.data.plans))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load plans.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const deactivate = async (id) => {
    try {
      await planApi.deactivate(id);
      toast.success('Plan deactivated.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate.');
    }
  };

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Subscription Plans</h1>
          <p className="text-slate-500 dark:text-slate-400">Define what you sell — Basic, Premium, Gold, whatever fits.</p>
        </div>
        <button className="btn-primary" onClick={() => setModalPlan({})}>
          <Plus size={18} /> New Plan
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : plans.length === 0 ? (
        <EmptyState title="No plans yet" subtitle="Create your first subscription plan to start billing customers." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((p, i) => {
            const visual = PLAN_VISUALS[i % PLAN_VISUALS.length];
            const Icon = visual.icon;
            return (
              <div key={p._id} className="card p-5 flex flex-col">
                <div className={`rounded-2xl ${visual.panel} dark:bg-slate-800 px-5 py-6 flex items-center justify-between`}>
                  <div className={`icon-circle h-12 w-12 bg-white/70 dark:bg-slate-900/60 ${visual.iconColor}`}>
                    <Icon size={22} />
                  </div>
                  {!p.isActive && <Badge tone="slate">Inactive</Badge>}
                </div>

                <h3 className="font-display font-bold text-lg mt-4">{p.name}</h3>
                {p.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{p.description}</p>}

                <p className="mt-3">
                  <span className="text-3xl font-display font-extrabold">₹{p.price}</span>
                  <span className="text-sm font-medium text-slate-400"> / {p.billingCycle.replace('_', ' ')}</span>
                </p>

                {p.features?.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {p.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-accent-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto pt-5 flex gap-2">
                  <button className="btn-secondary flex-1" onClick={() => setModalPlan(p)}>
                    <Pencil size={14} /> Edit
                  </button>
                  {p.isActive && (
                    <button className="btn-danger flex-1" onClick={() => deactivate(p._id)}>
                      <Ban size={14} /> Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PlanModal plan={modalPlan} onClose={() => setModalPlan(null)} onSaved={() => { setModalPlan(null); load(); }} />
    </DashboardShell>
  );
}

function PlanModal({ plan, onClose, onSaved }) {
  const isOpen = plan !== null;
  const isEdit = plan && plan._id;
  const [form, setForm] = useState({ name: '', description: '', price: '', billingCycle: 'monthly', features: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price ?? '',
        billingCycle: plan.billingCycle || 'monthly',
        features: (plan.features || []).join(', '),
      });
    }
  }, [plan]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      billingCycle: form.billingCycle,
      features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
    };
    try {
      if (isEdit) await planApi.update(plan._id, payload);
      else await planApi.create(payload);
      toast.success(isEdit ? 'Plan updated.' : 'Plan created.');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={isEdit ? 'Edit Plan' : 'New Plan'}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Plan Name</label>
          <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Premium" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Price (₹)</label>
            <input type="number" required min={0} className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="label">Billing Cycle</label>
            <select className="input" value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
              {CYCLES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="label">Features (comma-separated)</label>
          <input className="input" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Unlimited classes, Locker access" />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner /> : isEdit ? 'Save Changes' : 'Create Plan'}
        </button>
      </form>
    </Modal>
  );
}
