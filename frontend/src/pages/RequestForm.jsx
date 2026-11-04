import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { errMsg } from '../services/api.js';
import { BLOOD_GROUPS, getLocation, DISCLAIMER } from '../utils/constants.js';

const today = () => new Date().toISOString().slice(0, 10);

export default function RequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    patientName: '', bloodGroup: params.get('bloodGroup') || '', units: 1,
    hospitalName: user.hospitalName || '', city: params.get('city') || user.city || '', area: user.area || '',
    contactNumber: user.phone || '', requiredDate: today(), urgency: 'normal', notes: '', coordinates: user.coordinates || null,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const cls = (k) => `form-control ${errors[k] ? 'is-invalid' : ''}`;

  const validate = () => {
    const er = {};
    if (!form.patientName.trim()) er.patientName = 'Patient name is required';
    if (!form.bloodGroup) er.bloodGroup = 'Select the required blood group';
    if (!(Number(form.units) >= 1 && Number(form.units) <= 10)) er.units = 'Units must be 1 to 10';
    if (!form.hospitalName.trim()) er.hospitalName = 'Hospital name is required';
    if (!form.city.trim()) er.city = 'City is required';
    if (!/^[0-9+\-\s]{10,15}$/.test(form.contactNumber)) er.contactNumber = 'Enter a valid contact number';
    if (!form.requiredDate || form.requiredDate < today()) er.requiredDate = 'Choose today or a future date';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const locate = async () => {
    try { setForm({ ...form, coordinates: await getLocation() }); toast.success('Location added – nearest donors will be matched first'); }
    catch (e) { toast.error(e.message); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return toast.error('Please fix the highlighted fields');
    setBusy(true);
    try {
      const { data } = await api.post('/requests', { ...form, units: Number(form.units) });
      toast.success(`Request created. ${data.notifiedDonors} donor${data.notifiedDonors !== 1 ? 's' : ''} notified.`);
      navigate(`/dashboard/requests/${data.request._id}`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally { setBusy(false); }
  };

  const Err = ({ k }) => (errors[k] ? <div className="invalid-feedback d-block">{errors[k]}</div> : null);

  return (
    <>
      <h2 className="mb-1">Create a blood request</h2>
      <p className="text-muted">Matching available donors will be notified immediately.</p>
      <form className="panel" onSubmit={submit} noValidate>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label fw-semibold">Patient name</label><input className={cls('patientName')} value={form.patientName} onChange={set('patientName')} /><Err k="patientName" /></div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">Blood group</label>
            <select className={`form-select ${errors.bloodGroup ? 'is-invalid' : ''}`} value={form.bloodGroup} onChange={set('bloodGroup')}><option value="">Select...</option>{BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
            <Err k="bloodGroup" />
          </div>
          <div className="col-md-3"><label className="form-label fw-semibold">Units required</label><input type="number" min="1" max="10" className={cls('units')} value={form.units} onChange={set('units')} /><Err k="units" /></div>
          <div className="col-md-6"><label className="form-label fw-semibold">Hospital name</label><input className={cls('hospitalName')} value={form.hospitalName} onChange={set('hospitalName')} /><Err k="hospitalName" /></div>
          <div className="col-md-3"><label className="form-label fw-semibold">City</label><input className={cls('city')} value={form.city} onChange={set('city')} /><Err k="city" /></div>
          <div className="col-md-3"><label className="form-label fw-semibold">Area (optional)</label><input className="form-control" value={form.area} onChange={set('area')} /></div>
          <div className="col-md-4"><label className="form-label fw-semibold">Contact number</label><input type="tel" className={cls('contactNumber')} value={form.contactNumber} onChange={set('contactNumber')} /><Err k="contactNumber" /></div>
          <div className="col-md-4"><label className="form-label fw-semibold">Required by</label><input type="date" min={today()} className={cls('requiredDate')} value={form.requiredDate} onChange={set('requiredDate')} /><Err k="requiredDate" /></div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Priority</label>
            <select className="form-select" value={form.urgency} onChange={set('urgency')}>
              <option value="normal">Normal</option><option value="emergency">Emergency (within 24 hours)</option><option value="critical">Critical (immediate)</option>
            </select>
          </div>
          <div className="col-12"><label className="form-label fw-semibold">Additional information</label><textarea rows="3" maxLength="500" className="form-control" value={form.notes} onChange={set('notes')} placeholder="Ward, doctor's name, reason for transfusion..." /></div>
        </div>
        <button type="button" className="btn btn-light btn-sm mt-3 d-flex align-items-center gap-1" onClick={locate}><MapPin size={14} /> {form.coordinates ? 'Location added ✓' : 'Add my current location for nearest-donor matching'}</button>
        <div className="notice my-3">{DISCLAIMER}</div>
        <button className="btn btn-danger btn-lg" disabled={busy}>{busy ? 'Sending request...' : 'Send blood request'}</button>
      </form>
    </>
  );
}
