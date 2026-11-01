import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../../components/layout/DashboardShell';
import { PageLoader, Spinner, Modal, Badge, statusTone } from '../../components/ui/UI';
import { profileApi, uploadApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const toast = useToast();
  const { setUser, logout } = useAuth();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    profileApi
      .get()
      .then((res) => setProfile(res.data.profile))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load profile.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileApi.update({ fullName: profile.fullName, phone: profile.phone, profilePhotoUrl: profile.profilePhotoUrl });
      toast.success('Profile updated.');
      setUser((u) => ({ ...u, fullName: profile.fullName, phone: profile.phone, profilePhotoUrl: profile.profilePhotoUrl }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadApi.upload(file);
      setProfile({ ...profile, profilePhotoUrl: res.data.url });
      toast.success('Photo uploaded — save to apply.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    }
  };

  if (loading || !profile) return (<DashboardShell><PageLoader /></DashboardShell>);

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-1">My Profile</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6 capitalize">{profile.role} · {profile.business?.name}</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <form onSubmit={save} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                {profile.profilePhotoUrl ? <img src={profile.profilePhotoUrl} alt="" className="h-full w-full object-cover" /> : profile.fullName?.charAt(0).toUpperCase()}
              </div>
              <label className="btn-secondary cursor-pointer">
                Change Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>

            <div>
              <label className="label">Full Name</label>
              <input className="input" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input disabled className="input opacity-60" value={profile.email} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>

            {profile.role === 'customer' && profile.customer && (
              <div>
                <label className="label">Customer ID</label>
                <input disabled className="input opacity-60 font-mono" value={profile.customer.customerId} />
              </div>
            )}
            {profile.role !== 'customer' && profile.business && (
              <div>
                <label className="label">Business ID</label>
                <input disabled className="input opacity-60 font-mono" value={profile.business.businessId} />
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Spinner /> : 'Save Changes'}</button>
          </form>
        </div>

        <div className="space-y-4">
          {profile.role === 'customer' && profile.customer?.currentSubscription && (
            <div className="card p-5">
              <h3 className="font-display font-bold mb-2">Subscription</h3>
              <p className="text-sm text-slate-500">{profile.customer.currentSubscription.plan?.name}</p>
              <Badge tone={statusTone(profile.customer.subscriptionStatus)}>{profile.customer.subscriptionStatus.replace('_', ' ')}</Badge>
            </div>
          )}

          <div className="card p-5 space-y-2">
            <h3 className="font-display font-bold mb-2">Account</h3>
            <button className="btn-secondary w-full" onClick={() => setShowPassword(true)}>Change Password</button>
            <button className="btn-danger w-full" onClick={() => setShowDelete(true)}>Delete Account</button>
          </div>
        </div>
      </div>

      <ChangePasswordModal open={showPassword} onClose={() => setShowPassword(false)} />
      <DeleteAccountModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        role={profile.role}
        onDeleted={() => { logout(); navigate('/'); }}
      />
    </DashboardShell>
  );
}

function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await profileApi.changePassword(form);
      toast.success('Password changed.');
      setForm({ currentPassword: '', newPassword: '' });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Change Password">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Current Password</label>
          <input type="password" required className="input" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        </div>
        <div>
          <label className="label">New Password</label>
          <input type="password" required minLength={6} className="input" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? <Spinner /> : 'Change Password'}</button>
      </form>
    </Modal>
  );
}

function DeleteAccountModal({ open, onClose, role, onDeleted }) {
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!confirmed) return;
    setLoading(true);
    try {
      await profileApi.deleteAccount({ password });
      toast.success('Account deleted.');
      onDeleted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Delete Account">
      {role === 'owner' ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Owner accounts can't self-delete while the business is active, since your staff and customers depend on it.
          Transfer ownership or contact support to close the business entirely.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">This action is permanent. Your email cannot be reused.</p>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            I understand this cannot be undone.
          </label>
          <button type="submit" className="btn-danger w-full" disabled={loading || !confirmed}>
            {loading ? <Spinner /> : 'Permanently Delete Account'}
          </button>
        </form>
      )}
    </Modal>
  );
}
