import { useEffect, useState } from 'react';
import { Plus, Ban, Pencil } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { Badge, PageLoader, EmptyState, Modal, Spinner, ConfirmDialog } from '../../components/ui/UI';
import { staffApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    staffApi
      .list({ includeInactive: includeInactive || undefined })
      .then((res) => setStaff(res.data.staff))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load staff.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [includeInactive]);

  const deactivate = async () => {
    try {
      await staffApi.deactivate(deactivateTarget._id);
      toast.success('Staff member deactivated.');
      setDeactivateTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate.');
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Staff</h1>
          <p className="text-slate-500 dark:text-slate-400">Managers and receptionists on your team.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
            Show deactivated
          </label>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={18} /> Add Staff
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : staff.length === 0 ? (
          <EmptyState title="No staff added yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Contact</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s._id} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="py-3 px-4 font-medium">{s.name}</td>
                    <td className="py-3 px-4 text-slate-500">
                      <p>{s.email}</p>
                      <p className="text-xs">{s.phone}</p>
                    </td>
                    <td className="py-3 px-4 capitalize">{s.role}</td>
                    <td className="py-3 px-4">
                      <Badge tone={s.isActive ? 'green' : 'slate'}>{s.isActive ? 'Active' : 'Deactivated'}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {s.isActive && (
                        <div className="flex gap-2">
                          <button className="text-slate-500 hover:text-brand-600" onClick={() => setEditTarget(s)}>
                            <Pencil size={15} />
                          </button>
                          <button className="text-slate-500 hover:text-rose-600" onClick={() => setDeactivateTarget(s)}>
                            <Ban size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StaffModal mode="add" open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />
      <StaffModal mode="edit" staff={editTarget} open={!!editTarget} onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); load(); }} />
      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate Staff"
        message={`Deactivate ${deactivateTarget?.name}? They will lose login access. Their historical records (invoices, payments) are preserved.`}
        confirmLabel="Deactivate"
        danger
        onConfirm={deactivate}
      />
    </DashboardShell>
  );
}

function StaffModal({ mode, staff, open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'receptionist' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (mode === 'edit' && staff) {
      setForm({ name: staff.name, email: staff.email, phone: staff.phone || '', password: '', role: staff.role });
    } else if (mode === 'add' && open) {
      setForm({ name: '', email: '', phone: '', password: '', role: 'receptionist' });
    }
  }, [mode, staff, open]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'add') {
        await staffApi.add(form);
        toast.success('Staff member added.');
      } else {
        await staffApi.update(staff._id, { name: form.name, phone: form.phone, role: form.role });
        toast.success('Staff member updated.');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === 'add' ? 'Add Staff' : `Edit ${staff?.name}`}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Email</label>
            <input type="email" required disabled={mode === 'edit'} className="input disabled:opacity-60" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="manager">Manager</option>
            <option value="receptionist">Receptionist</option>
          </select>
        </div>
        {mode === 'add' && (
          <div>
            <label className="label">Temporary Password</label>
            <input type="password" required minLength={6} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner /> : mode === 'add' ? 'Add Staff' : 'Save Changes'}
        </button>
      </form>
    </Modal>
  );
}
