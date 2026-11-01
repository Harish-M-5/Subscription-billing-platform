import { useEffect, useState } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import { PageLoader, Spinner } from '../../components/ui/UI';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import { businessApi, uploadApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

const TABS = [
  { key: 'profile', label: 'Business Profile' },
  { key: 'preferences', label: 'Preferences' },
];

export default function BusinessSettings() {
  const [business, setBusiness] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('profile');
  const toast = useToast();

  const load = () => {
    setLoading(true);
    businessApi
      .getMine()
      .then((res) => {
        setBusiness(res.data.business);
        setSettings(res.data.settings || { expiringSoonThresholdDays: 7, currency: 'INR', notifications: { email: true, sms: false } });
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load settings.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const saveBusiness = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await businessApi.update({ name: business.name, address: business.address, logoUrl: business.logoUrl });
      toast.success('Business details updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await businessApi.updateSettings(settings);
      toast.success('Settings updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadApi.upload(file);
      setBusiness({ ...business, logoUrl: res.data.url });
      toast.success('Logo uploaded — save to apply.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    }
  };

  if (loading || !business) return (<DashboardShell><PageLoader /></DashboardShell>);

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your business profile and preferences.</p>
        </div>
        <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'profile' && (
        <form onSubmit={saveBusiness} className="card p-6 space-y-4 max-w-xl">
          <h2 className="font-display font-bold">Business Profile</h2>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
              {business.logoUrl ? <img src={business.logoUrl} alt="logo" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-400">No logo</span>}
            </div>
            <label className="btn-secondary cursor-pointer">
              Upload Logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </label>
          </div>
          <div>
            <label className="label">Business ID</label>
            <input disabled className="input opacity-60 font-mono" value={business.businessId} />
          </div>
          <div>
            <label className="label">Business Type</label>
            <input disabled className="input opacity-60" value={business.type} />
          </div>
          <div>
            <label className="label">Business Name</label>
            <input className="input" value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={business.address || ''} onChange={(e) => setBusiness({ ...business, address: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Spinner /> : 'Save Changes'}</button>
        </form>
      )}

      {tab === 'preferences' && (
        <div className="card p-6 space-y-4 max-w-xl">
          <h2 className="font-display font-bold">Preferences</h2>
          <div>
            <label className="label">"Expiring Soon" threshold (days before expiry)</label>
            <input
              type="number"
              min={1}
              className="input"
              value={settings.expiringSoonThresholdDays}
              onChange={(e) => setSettings({ ...settings, expiringSoonThresholdDays: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Currency</label>
            <input className="input" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.notifications?.email}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, email: e.target.checked } })}
              />
              Email notifications (payment confirmations, invoices, renewals)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.notifications?.sms}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, sms: e.target.checked } })}
              />
              SMS notifications
            </label>
          </div>
          <button className="btn-primary" onClick={saveSettings} disabled={saving}>{saving ? <Spinner /> : 'Save Preferences'}</button>
        </div>
      )}
    </DashboardShell>
  );
}
