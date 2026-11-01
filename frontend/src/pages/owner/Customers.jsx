import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { Badge, statusTone, EmptyState, Modal, Spinner, ConfirmDialog } from '../../components/ui/UI';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { customerApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';

export default function Customers() {
  const { user } = useAuth();
  const canEdit = hasPermission(user, PERMISSIONS.CUSTOMER_EDIT);
  const canDelete = hasPermission(user, PERMISSIONS.CUSTOMER_DELETE);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchParams] = useSearchParams();
  // Prefills from the topbar's quick-search (?q=) so navigating there from
  // the search bar lands directly on matching results.
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const load = (page = 1) => {
    setLoading(true);
    customerApi
      .list({ search, status, page, limit: 10 })
      .then((res) => {
        setCustomers(res.data.customers);
        setPagination(res.data.pagination);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load customers.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await customerApi.remove(deleteTarget._id);
      toast.success('Customer deleted.');
      setDeleteTarget(null);
      load(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Customer Management</h1>
          <p className="text-slate-500 dark:text-slate-400">{pagination.total} total</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search name, email, phone or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="none">No Subscription</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <SkeletonTable rows={6} columns={6} />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers found" subtitle="Try a different search or add a new customer." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Contact</th>
                  <th className="py-3 px-4 font-medium">Plan</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Joined</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <Link to={`/app/customers/${c._id}`} className="font-medium hover:text-brand-600">{c.name}</Link>
                      <p className="text-xs text-slate-400 font-mono">{c.customerId}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <p>{c.email}</p>
                      <p className="text-xs text-slate-400">{c.phone}</p>
                    </td>
                    <td className="py-3 px-4">{c.currentSubscription?.plan?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <Badge tone={statusTone(c.subscriptionStatus)}>{c.subscriptionStatus.replace('_', ' ')}</Badge>
                        {c.currentInvoice && c.currentInvoice.status !== 'paid' && (
                          <Badge tone={statusTone(c.currentInvoice.status)}>
                            {c.currentInvoice.status === 'partial' ? `₹${c.currentInvoice.balanceDue.toLocaleString()} due` : 'Unpaid'}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{new Date(c.joinDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-3">
                        <Link to={`/app/customers/${c._id}`} className="text-slate-500 hover:text-brand-600" title="View">
                          <Eye size={16} />
                        </Link>
                        {canEdit && (
                          <button className="text-slate-500 hover:text-brand-600" title="Edit" onClick={() => setEditTarget(c)}>
                            <Pencil size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button className="text-slate-500 hover:text-rose-600" title="Delete" onClick={() => setDeleteTarget(c)}>
                            <Trash2 size={16} />
                          </button>
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

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button className="btn-secondary !px-3" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-slate-500">Page {pagination.page} of {pagination.pages}</span>
          <button className="btn-secondary !px-3" disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <AddCustomerModal open={showAdd} onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(1); }} />
      <EditCustomerModal customer={editTarget} onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); load(pagination.page); }} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Customer"
        message={deleteTarget ? `Delete ${deleteTarget.name}? Their account will be deactivated. Historical payments and invoices are preserved for your records.` : ''}
        confirmLabel="Delete Customer"
        danger
        loading={deleting}
        onConfirm={handleDelete}
      />
    </DashboardShell>
  );
}

function AddCustomerModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await customerApi.add(form);
      toast.success('Customer added.');
      setForm({ name: '', email: '', phone: '', address: '', password: '' });
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Customer">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input required className="input" value={form.name} onChange={set('name')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input required className="input" value={form.phone} onChange={set('phone')} />
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={set('address')} />
        </div>
        <div>
          <label className="label">Temporary Password</label>
          <input type="password" required minLength={6} className="input" value={form.password} onChange={set('password')} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner /> : 'Add Customer'}
        </button>
      </form>
    </Modal>
  );
}

function EditCustomerModal({ customer, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (customer) setForm({ name: customer.name || '', phone: customer.phone || '', address: customer.address || '' });
  }, [customer]);

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
    <Modal open={!!customer} onClose={onClose} title="Edit Customer">
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
