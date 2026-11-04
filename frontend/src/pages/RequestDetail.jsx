import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, X, Phone, Mail, MapPin, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { errMsg } from '../services/api.js';
import { Loader, ErrorBox, StatusBadge, UrgencyBadge, BloodBadge } from '../components/ui.jsx';
import { fmtDate, fmtDateTime, fmtMinutes, DISCLAIMER } from '../utils/constants.js';

function Timeline({ r }) {
  const cancelled = r.status === 'cancelled';
  const steps = [
    ['Request created', true],
    ['Donor accepted', ['accepted', 'completed'].includes(r.status) || (cancelled && r.acceptedDonor)],
    [cancelled ? 'Cancelled' : 'Completed', r.status === 'completed' || cancelled],
  ];
  return (
    <div className="timeline">
      {steps.map(([label, done], i) => (
        <div key={label} className={`tl-step ${done ? (i === 2 && cancelled ? 'bad' : 'done') : ''}`}>
          <div className="tl-dot">{done ? (i === 2 && cancelled ? <X size={15} /> : <Check size={15} />) : null}</div>
          {label}
        </div>
      ))}
    </div>
  );
}

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [r, setR] = useState(null);
  const [error, setError] = useState('');
  const [suggested, setSuggested] = useState(null);
  const [sent, setSent] = useState([]);

  const load = () => api.get(`/requests/${id}`).then((x) => setR(x.data.request)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const isOwner = r && (r.requester?._id === user._id || r.requester === user._id);
  const isAdmin = user.role === 'admin';
  const isDonor = user.role === 'donor';
  const canSend = (isOwner || isAdmin) && r?.status === 'pending';

  // Owner or admin sees extra donors (nearest first) that they can send the request to
  useEffect(() => {
    if (!r || !canSend) return;
    api.get('/donors/search', { params: { bloodGroup: r.bloodGroup, city: r.city, lat: r.coordinates?.lat, lng: r.coordinates?.lng } })
      .then((x) => setSuggested(x.data.donors.slice(0, 12))).catch(() => setSuggested([]));
  }, [r?._id, r?.status, canSend]); // eslint-disable-line

  const act = async (fn, okMsg) => {
    try { const res = await fn(); toast.success(okMsg || res.data.message); await load(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const setStatus = (status) => act(() => api.put(`/requests/${id}/status`, { status }), `Request marked as ${status}`);
  const respond = (response) => act(() => api.post(`/requests/${id}/respond`, { response }));
  const sendTo = async (donorId) => {
    try { const { data } = await api.post(`/requests/${id}/send/${donorId}`); toast.success(data.message); setSent((s) => [...s, donorId]); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this request permanently?')) return;
    try { await api.delete(`/requests/${id}`); toast.success('Request deleted'); navigate('/dashboard/requests'); } catch (e) { toast.error(errMsg(e)); }
  };

  if (error) return <><Link to="/dashboard/requests" className="btn btn-link ps-0"><ArrowLeft size={16} /> Back</Link><ErrorBox message={error} /></>;
  if (!r) return <Loader />;

  const donorInfo = r.acceptedDonor?.name ? r.acceptedDonor : null;
  const responses = r.responses || [];

  return (
    <>
      <Link to="/dashboard/requests" className="btn btn-link ps-0 mb-2 d-inline-flex align-items-center gap-1"><ArrowLeft size={16} /> Back to requests</Link>
      <div className="row g-3">
        <div className="col-lg-8">
          <div className={`req-card u-${r.urgency} p-4 mb-3`}>
            <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
              <div>
                <h3 className="mb-1">{r.patientName}</h3>
                <div className="text-muted d-flex align-items-center gap-1"><MapPin size={15} /> {r.hospitalName}, {r.area ? `${r.area}, ` : ''}{r.city}</div>
              </div>
              <div className="d-flex gap-2 align-items-start"><BloodBadge group={r.bloodGroup} size="lg" /><UrgencyBadge urgency={r.urgency} /><StatusBadge status={r.status} /></div>
            </div>
            <div className="row g-3 small">
              <div className="col-6 col-md-3"><div className="text-muted">Units</div><strong>{r.units}</strong></div>
              <div className="col-6 col-md-3"><div className="text-muted">Needed by</div><strong>{fmtDate(r.requiredDate)}</strong></div>
              <div className="col-6 col-md-3"><div className="text-muted">Raised</div><strong>{fmtDateTime(r.createdAt)}</strong></div>
              <div className="col-6 col-md-3"><div className="text-muted">First response</div><strong>{fmtMinutes(r.firstResponseMinutes)}</strong></div>
              {r.contactNumber && <div className="col-6 col-md-3"><div className="text-muted">Contact</div><strong>{r.contactNumber}</strong></div>}
              {r.requester && !isOwner && <div className="col-6 col-md-3"><div className="text-muted">Raised by</div><strong>{r.requester.hospitalName || r.requester.name}</strong></div>}
              <div className="col-6 col-md-3"><div className="text-muted">Donors notified</div><strong>{r.matchedCount}</strong></div>
            </div>
            {r.notes && <p className="mt-3 mb-0">“{r.notes}”</p>}
          </div>

          <div className="panel mb-3">
            <h6>Request status</h6>
            <Timeline r={r} />
          </div>

          {/* Donor actions */}
          {isDonor && (
            <div className="panel mb-3">
              {r.status === 'pending' && !r.myResponse ? (
                <>
                  <h6>Can you donate?</h6>
                  <p className="small text-muted">If you accept, the requester will see your phone number and email so they can reach you. Eligibility must be confirmed by the hospital.</p>
                  <button className="btn btn-danger me-2" onClick={() => respond('accepted')}>Accept request</button>
                  <button className="btn btn-outline-secondary" onClick={() => respond('declined')}>Decline</button>
                </>
              ) : (
                <p className="mb-0">{r.myResponse ? <>You <strong>{r.myResponse}</strong> this request.</> : <>This request is <strong>{r.status}</strong>.</>}{r.contactNumber && <> Patient contact: <strong>{r.contactNumber}</strong>.</>}</p>
              )}
            </div>
          )}

          {/* Owner / admin: donor responses */}
          {(isOwner || isAdmin) && (
            <div className="panel mb-3">
              <h6>Donor responses</h6>
              {donorInfo && (
                <div className="alert alert-success">
                  <strong>{donorInfo.name}</strong> ({donorInfo.bloodGroup}) from {donorInfo.city} accepted this request.
                  {donorInfo.phone && <div className="mt-1 d-flex flex-wrap gap-3"><span><Phone size={14} /> {donorInfo.phone}</span><span><Mail size={14} /> {donorInfo.email}</span></div>}
                </div>
              )}
              {responses.length === 0 ? <p className="text-muted small mb-0">No donor has responded yet. {r.matchedCount} donor{r.matchedCount !== 1 ? 's were' : ' was'} notified.</p> : (
                <ul className="list-group list-group-flush">
                  {responses.map((x) => (
                    <li key={x.donor?._id} className="list-group-item px-0 d-flex justify-content-between">
                      <span>{x.donor?.name} <span className="text-muted small">· {x.donor?.city}</span></span>
                      <span className={x.response === 'accepted' ? 'text-success fw-semibold' : 'text-muted'}>{x.response} · {fmtDateTime(x.respondedAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Owner / admin: send to more donors */}
          {canSend && (
            <div className="panel mb-3">
              <h6>Send to more donors {suggested?.[0]?.distanceKm != null && <span className="text-muted small">(nearest first)</span>}</h6>
              {!suggested ? <Loader text="Finding donors..." /> : suggested.length === 0 ? <p className="text-muted small mb-0">No other available {r.bloodGroup} donors found in {r.city}.</p> : (
                <div className="row g-2">
                  {suggested.map((d) => (
                    <div className="col-md-6" key={d._id}>
                      <div className="border rounded p-2 d-flex justify-content-between align-items-center">
                        <div><div className="fw-semibold">{d.name}</div><div className="small text-muted">{d.area ? `${d.area}, ` : ''}{d.city}{d.distanceKm != null ? ` · ${d.distanceKm} km` : ''}</div></div>
                        <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" disabled={sent.includes(d._id)} onClick={() => sendTo(d._id)}><Send size={13} /> {sent.includes(d._id) ? 'Sent' : 'Send'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="col-lg-4">
          {(isOwner || isAdmin) && (
            <div className="panel mb-3">
              <h6>Manage request</h6>
              <div className="d-grid gap-2">
                {r.status === 'accepted' && <button className="btn btn-success" onClick={() => setStatus('completed')}>Mark as completed</button>}
                {isAdmin && r.status === 'pending' && <button className="btn btn-outline-primary" onClick={() => setStatus('accepted')}>Mark as accepted</button>}
                {['pending', 'accepted'].includes(r.status) && <button className="btn btn-outline-secondary" onClick={() => window.confirm('Cancel this request?') && setStatus('cancelled')}>Cancel request</button>}
                {(isAdmin || ['pending', 'cancelled'].includes(r.status)) && <button className="btn btn-outline-danger" onClick={remove}>Delete request</button>}
                {['completed'].includes(r.status) && !isAdmin && <p className="small text-muted mb-0">This request is complete. Thank you!</p>}
              </div>
            </div>
          )}
          <div className="notice">{DISCLAIMER}</div>
        </div>
      </div>
    </>
  );
}
