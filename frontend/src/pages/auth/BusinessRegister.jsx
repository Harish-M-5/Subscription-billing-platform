import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/UI';

const BUSINESS_TYPES = [
  'Gym', 'Clinic', 'Coaching Institute', 'Tuition Center', 'Salon',
  'Yoga Center', 'Dance Academy', 'Music Academy', 'Sports Academy',
  'Training Center', 'Other',
];

export default function BusinessRegister() {
  const { registerBusiness } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '',
    businessName: '', businessType: 'Gym', customType: '', address: '',
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await registerBusiness(form);
      toast.success(`Business created! Your Business ID is ${data.business.businessId}`);
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Register Your Business" subtitle="Create an Owner account and get a unique Business ID" wide>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Owner Information</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input required className="input" value={form.fullName} onChange={set('fullName')} />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input required className="input" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required minLength={6} className="input" value={form.password} onChange={set('password')} />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Business Information</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Business Name</label>
              <input required className="input" value={form.businessName} onChange={set('businessName')} />
            </div>
            <div>
              <label className="label">Business Type</label>
              <select className="input" value={form.businessType} onChange={set('businessType')}>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {form.businessType === 'Other' && (
              <div className="sm:col-span-2">
                <label className="label">Custom Business Type</label>
                <input className="input" value={form.customType} onChange={set('customType')} placeholder="e.g. Pet Grooming Studio" />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="label">Business Address</label>
              <input className="input" value={form.address} onChange={set('address')} />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner /> : 'Create Business Account'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login/business" className="font-semibold text-brand-600 dark:text-brand-400">Log in</Link>
      </p>
    </AuthShell>
  );
}
