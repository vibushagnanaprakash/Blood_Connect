import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';
import { BLOOD_GROUPS, getLocation } from '../utils/constants.js';

const ROLES = [['donor', 'Donor'], ['requester', 'Patient / family'], ['hospital', 'Hospital']];

function Field({ label, error, children }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      {children}
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    role: ROLES.some(([r]) => r === params.get('role')) ? params.get('role') : 'donor',
    name: '', email: '', phone: '', password: '', confirm: '', bloodGroup: '', city: '', area: '', hospitalName: '', coordinates: null,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email';
    if (!/^[0-9+\-\s]{10,15}$/.test(form.phone)) er.phone = 'Enter a valid phone number (10-15 digits)';
    if (form.password.length < 6) er.password = 'At least 6 characters';
    if (form.password !== form.confirm) er.confirm = 'Passwords do not match';
    if (!form.city.trim()) er.city = 'City is required';
    if (form.role === 'donor' && !form.bloodGroup) er.bloodGroup = 'Choose your blood group';
    if (form.role === 'hospital' && !form.hospitalName.trim()) er.hospitalName = 'Hospital name is required';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const useMyLocation = async () => {
    try {
      const c = await getLocation();
      setForm({ ...form, coordinates: c });
      toast.success('Location saved. Nearby matching will work better.');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const { confirm, ...payload } = form;
      await register(payload);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  // Plain function (not a component) so inputs keep focus while typing
  const input = (id, type = 'text', extra = {}) => (
    <input type={type} className={`form-control ${errors[id] ? 'is-invalid' : ''}`} value={form[id]} onChange={set(id)} {...extra} />
  );

  return (
    <div className="container py-5" style={{ maxWidth: 680 }}>
      <div className="panel p-4">
        <h2 className="mb-1">Create your account</h2>
        <p className="text-muted">Choose how you will use BloodConnect.</p>
        <div className="btn-group w-100 mb-4" role="group">
          {ROLES.map(([r, label]) => (
            <button type="button" key={r} className={`btn ${form.role === r ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setForm({ ...form, role: r })}>{label}</button>
          ))}
        </div>
        <form onSubmit={submit} noValidate>
          <div className="row">
            <div className="col-md-6"><Field label={form.role === 'hospital' ? 'Contact person name' : 'Full name'} error={errors.name}>{input('name', 'text', { autoComplete: 'name' })}</Field></div>
            <div className="col-md-6"><Field label="Phone" error={errors.phone}>{input('phone', 'tel', {autoComplete:'tel'})}</Field></div>
            <div className="col-md-12"><Field label="Email" error={errors.email}>{input('email', 'email', {autoComplete:'email'})}</Field></div>
            {form.role === 'hospital' && <div className="col-md-12"><Field label="Hospital name" error={errors.hospitalName}>{input('hospitalName', 'text', {})}</Field></div>}
            {form.role === 'donor' && (
              <div className="col-md-6">
                <Field label="Blood group" error={errors.bloodGroup}>
                  <select className={`form-select ${errors.bloodGroup ? 'is-invalid' : ''}`} value={form.bloodGroup} onChange={set('bloodGroup')}>
                    <option value="">Select...</option>
                    {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </Field>
              </div>
            )}
            <div className="col-md-6"><Field label="City" error={errors.city}>{input('city', 'text', {})}</Field></div>
            <div className="col-md-6"><Field label="Area / locality (optional)" error={errors.area}>{input('area', 'text', {})}</Field></div>
            <div className="col-md-6"><Field label="Password" error={errors.password}>{input('password', 'password', {autoComplete:'new-password'})}</Field></div>
            <div className="col-md-6"><Field label="Confirm password" error={errors.confirm}>{input('confirm', 'password', {autoComplete:'new-password'})}</Field></div>
          </div>
          <button type="button" className="btn btn-light btn-sm mb-3 d-flex align-items-center gap-1" onClick={useMyLocation}>
            <MapPin size={14} /> {form.coordinates ? 'Location saved ✓' : 'Save my location for nearest-donor matching (optional)'}
          </button>
          <button className="btn btn-danger w-100" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
        </form>
        <p className="text-center mt-3 mb-0 small">Already registered? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
