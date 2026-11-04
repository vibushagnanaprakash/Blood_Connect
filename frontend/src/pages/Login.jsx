import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address');
    if (!form.password) return setError('Enter your password');
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 440 }}>
      <div className="panel p-4">
        <h2 className="mb-1">Log in</h2>
        <p className="text-muted">Donors, requesters, hospitals and admins all log in here.</p>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={submit} noValidate>
          <label className="form-label fw-semibold">Email</label>
          <input type="email" className="form-control mb-3" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
          <label className="form-label fw-semibold">Password</label>
          <input type="password" className="form-control mb-4" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
          <button className="btn btn-danger w-100" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
        </form>
        <p className="text-center mt-3 mb-0 small">New here? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
