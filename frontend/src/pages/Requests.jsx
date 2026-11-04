import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { errMsg } from '../services/api.js';
import { Loader, ErrorBox, EmptyState, StatusBadge, UrgencyBadge, BloodBadge } from '../components/ui.jsx';
import { fmtDate, timeAgo } from '../utils/constants.js';

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', status: 'all', urgency: 'all' });

  const load = () => {
    setError('');
    api.get('/requests', { params: filters }).then((r) => setRequests(r.data.requests)).catch((e) => setError(errMsg(e)));
  };
  useEffect(load, [filters.status, filters.urgency]); // eslint-disable-line

  const respond = async (id, response) => {
    try {
      const { data } = await api.post(`/requests/${id}/respond`, { response });
      toast.success(data.message);
      load();
    } catch (e) { toast.error(errMsg(e)); load(); }
  };
  const setStatus = async (id, status) => {
    try { await api.put(`/requests/${id}/status`, { status }); toast.success(`Marked as ${status}`); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this request permanently?')) return;
    try { await api.delete(`/requests/${id}`); toast.success('Request deleted'); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const isDonor = user.role === 'donor';
  const isAdmin = user.role === 'admin';

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h2 className="m-0">{isDonor ? 'Blood requests sent to you' : isAdmin ? 'All blood requests' : 'My blood requests'}</h2>
        {!isDonor && <Link to="/dashboard/requests/new" className="btn btn-danger d-flex align-items-center gap-1"><PlusCircle size={16} /> New request</Link>}
      </div>

      <form className="panel mb-3" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <div className="row g-2">
          <div className="col-md-5"><input className="form-control" placeholder="Search patient, hospital or city" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></div>
          <div className="col-6 col-md-3">
            <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="all">All statuses</option>
              {['pending', 'accepted', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={filters.urgency} onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}>
              <option value="all">Any urgency</option><option value="normal">Normal</option><option value="emergency">Emergency</option><option value="critical">Critical</option>
            </select>
          </div>
          <div className="col-md-2"><button className="btn btn-navy w-100">Search</button></div>
        </div>
      </form>

      {error && <ErrorBox message={error} />}
      {!requests && !error && <Loader />}
      {requests && requests.length === 0 && <EmptyState title="No requests found" text={isDonor ? 'Requests matching your blood group will appear here.' : 'Try changing the filters.'} />}

      {/* Donor view: cards with accept / decline */}
      {requests && isDonor && requests.map((r) => (
        <div key={r._id} className={`req-card u-${r.urgency} mb-3`}>
          <div className="d-flex justify-content-between flex-wrap gap-2">
            <div>
              <div className="d-flex gap-2 align-items-center mb-1"><BloodBadge group={r.bloodGroup} size="lg" /><UrgencyBadge urgency={r.urgency} /><StatusBadge status={r.status} /></div>
              <div className="fw-bold">{r.hospitalName}, {r.area ? `${r.area}, ` : ''}{r.city}</div>
              <div className="small text-muted">Patient: {r.patientName} · {r.units} unit{r.units > 1 ? 's' : ''} · needed by {fmtDate(r.requiredDate)} · {timeAgo(r.createdAt)}</div>
              {r.notes && <div className="small mt-1">“{r.notes}”</div>}
              {r.contactNumber && <div className="small mt-1 fw-semibold">Contact: {r.contactNumber}</div>}
            </div>
            <div className="d-flex gap-2 align-items-start">
              {r.status === 'pending' && !r.myResponse ? (
                <>
                  <button className="btn btn-danger btn-sm" onClick={() => respond(r._id, 'accepted')}>Accept</button>
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => respond(r._id, 'declined')}>Decline</button>
                </>
              ) : (
                <span className="small text-muted">{r.myResponse ? `You ${r.myResponse}` : `Request ${r.status}`}</span>
              )}
              <Link to={`/dashboard/requests/${r._id}`} className="btn btn-light btn-sm"><Eye size={15} /></Link>
            </div>
          </div>
        </div>
      ))}

      {/* Requester / hospital / admin view: table */}
      {requests && !isDonor && requests.length > 0 && (
        <div className="panel p-0 table-responsive">
          <table className="table align-middle mb-0">
            <thead><tr><th>Patient</th><th>Group</th><th>Hospital</th><th>Urgency</th><th>Status</th>{isAdmin && <th>By</th>}<th>Created</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td className="fw-semibold">{r.patientName}<div className="small text-muted">{r.units} unit{r.units > 1 ? 's' : ''}</div></td>
                  <td><BloodBadge group={r.bloodGroup} /></td>
                  <td>{r.hospitalName}<div className="small text-muted">{r.city}</div></td>
                  <td><UrgencyBadge urgency={r.urgency} /></td>
                  <td>
                    {isAdmin && ['pending', 'accepted'].includes(r.status) ? (
                      <select className="form-select form-select-sm" value={r.status} onChange={(e) => e.target.value !== r.status && setStatus(r._id, e.target.value)}>
                        {r.status === 'pending' && <option value="pending">pending</option>}
                        {r.status === 'pending' && <option value="accepted">accepted</option>}
                        {r.status === 'accepted' && <option value="accepted">accepted</option>}
                        {r.status === 'accepted' && <option value="completed">completed</option>}
                        <option value="cancelled">cancelled</option>
                      </select>
                    ) : <StatusBadge status={r.status} />}
                  </td>
                  {isAdmin && <td className="small">{r.requester?.hospitalName || r.requester?.name}</td>}
                  <td className="small text-muted">{timeAgo(r.createdAt)}</td>
                  <td className="text-end text-nowrap">
                    <Link to={`/dashboard/requests/${r._id}`} className="btn btn-light btn-sm me-1" title="View / track"><Eye size={15} /></Link>
                    {!isAdmin && ['pending', 'accepted'].includes(r.status) && <button className="btn btn-outline-secondary btn-sm me-1" onClick={() => window.confirm('Cancel this request?') && setStatus(r._id, 'cancelled')}>Cancel</button>}
                    {(isAdmin || ['pending', 'cancelled'].includes(r.status)) && <button className="btn btn-outline-danger btn-sm" onClick={() => remove(r._id)} title="Delete"><Trash2 size={15} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
