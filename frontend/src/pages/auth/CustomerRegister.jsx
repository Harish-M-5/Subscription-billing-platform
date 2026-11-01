import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/UI';

export default function CustomerRegister() {
  const { registerCustomer } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', businessId: '' });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await registerCustomer(form);
      toast.success(`Account created! Your Customer ID is ${data.user.customerId}`);
      navigate('/portal/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create Customer Account" subtitle="You'll need the Business ID from your gym, clinic, or academy">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Business ID</label>
          <input required className="input font-mono uppercase" value={form.businessId} onChange={set('businessId')} placeholder="BUS-GYM-00123" />
        </div>
        <div>
          <label className="label">Full Name</label>
          <input required className="input" value={form.name} onChange={set('name')} />
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
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner /> : 'Create Account'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Already registered?{' '}
        <Link to="/login/customer" className="font-semibold text-brand-600 dark:text-brand-400">Log in</Link>
      </p>
    </AuthShell>
  );
}
