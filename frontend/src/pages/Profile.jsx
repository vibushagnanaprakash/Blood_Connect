import { useState } from 'react';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { errMsg } from '../services/api.js';
import { BLOOD_GROUPS, getLocation } from '../utils/constants.js';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name, phone: user.phone, city: user.city, area: user.area || '', hospitalName: user.hospitalName || '',
    bloodGroup: user.bloodGroup || '', available: user.available, coordinates: user.coordinates || null,
    lastDonationDate: user.lastDonationDate ? user.lastDonationDate.slice(0, 10) : '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const cls = (k) => `form-control ${errors[k] ? 'is-invalid' : ''}`;

  const locate = async () => {
    try { setForm({ ...form, coordinates: await getLocation() }); toast.success('Location captured. Click Save changes to store it.'); }
    catch (e) { toast.error(e.message); }
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Enter your name';
    if (!/^[0-9+\-\s]{10,15}$/.test(form.phone)) er.phone = 'Enter a valid phone number';
    if (!form.city.trim()) er.city = 'City is required';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const { data } = await api.put('/auth/me', form);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <>
      <h2 className="mb-3">My profile</h2>
      <form className="panel" style={{ maxWidth: 720 }} onSubmit={submit} noValidate>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label fw-semibold">Name</label><input className={cls('name')} value={form.name} onChange={set('name')} />{errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}</div>
          <div className="col-md-6"><label className="form-label fw-semibold">Email</label><input className="form-control" value={user.email} disabled /></div>
          <div className="col-md-6"><label className="form-label fw-semibold">Phone</label><input className={cls('phone')} value={form.phone} onChange={set('phone')} />{errors.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}</div>
          <div className="col-md-3"><label className="form-label fw-semibold">City</label><input className={cls('city')} value={form.city} onChange={set('city')} />{errors.city && <div className="invalid-feedback d-block">{errors.city}</div>}</div>
          <div className="col-md-3"><label className="form-label fw-semibold">Area</label><input className="form-control" value={form.area} onChange={set('area')} /></div>
          {user.role === 'hospital' && <div className="col-12"><label className="form-label fw-semibold">Hospital name</label><input className="form-control" value={form.hospitalName} onChange={set('hospitalName')} /></div>}
          {user.role === 'donor' && (
            <>
              <div className="col-md-4"><label className="form-label fw-semibold">Blood group</label><select className="form-select" value={form.bloodGroup} onChange={set('bloodGroup')}>{BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}</select></div>
              <div className="col-md-4"><label className="form-label fw-semibold">Last donation date</label><input type="date" className="form-control" value={form.lastDonationDate} onChange={set('lastDonationDate')} /></div>
              <div className="col-md-4 d-flex align-items-end"><div className="form-check form-switch"><input className="form-check-input" type="checkbox" id="av" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /><label className="form-check-label fw-semibold" htmlFor="av">Available to donate</label></div></div>
            </>
          )}
        </div>
        <button type="button" className="btn btn-light btn-sm mt-3 d-flex align-items-center gap-1" onClick={locate}><MapPin size={14} /> {form.coordinates?.lat != null ? `Location saved (${form.coordinates.lat}, ${form.coordinates.lng}) – update` : 'Save my current location'}</button>
        <button className="btn btn-danger mt-3" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
      </form>
    </>
  );
}
