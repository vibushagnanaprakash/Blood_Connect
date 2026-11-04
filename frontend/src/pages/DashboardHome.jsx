import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users, HeartPulse, FileText, Clock, Siren, CheckCircle2, Timer, PlusCircle, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { errMsg } from '../services/api.js';
import { Loader, ErrorBox, StatCard, BarChart, EmptyState, StatusBadge, UrgencyBadge, BloodBadge } from '../components/ui.jsx';
import { fmtMinutes, timeAgo, DISCLAIMER } from '../utils/constants.js';

export default function DashboardHome() {
  const { user } = useAuth();
  return (
    <>
      <h2 className="mb-1">Hello, {user.hospitalName || user.name.split(' ')[0]} 👋</h2>
      <p className="text-muted mb-4">{user.role === 'admin' ? 'Platform overview' : user.role === 'donor' ? 'Your donor dashboard' : 'Your requests at a glance'}</p>
      {user.role === 'admin' ? <AdminHome /> : user.role === 'donor' ? <DonorHome /> : <OwnerHome />}
      <div className="notice mt-4">{DISCLAIMER}</div>
    </>
  );
}

function useRequests() {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/requests').then((r) => setRequests(r.data.requests)).catch((e) => setError(errMsg(e)));
  }, []);
  return [requests, error];
}

function DonorHome() {
  const { user, updateUser } = useAuth();
  const [requests, error] = useRequests();

  const toggle = async () => {
    try {
      const { data } = await api.put('/auth/me', { available: !user.available });
      updateUser(data.user);
      toast.success(data.user.available ? 'You are now available to donate' : 'You are now marked unavailable');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  if (error) return <ErrorBox message={error} />;
  if (!requests) return <Loader />;
  const waiting = requests.filter((r) => r.status === 'pending' && !r.myResponse);
  const accepted = requests.filter((r) => r.myResponse === 'accepted').length;
  const declined = requests.filter((r) => r.myResponse === 'declined').length;

  return (
    <>
      <div className="panel d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <BloodBadge group={user.bloodGroup} size="lg" />
          <div>
            <div className="fw-bold">{user.available ? 'You are visible to people who need blood' : 'You are hidden from donor search'}</div>
            <div className="small text-muted">{user.area ? `${user.area}, ` : ''}{user.city}</div>
          </div>
        </div>
        <div className="form-check form-switch fs-5 m-0">
          <input className="form-check-input" type="checkbox" role="switch" id="avail" checked={user.available} onChange={toggle} />
          <label className="form-check-label fs-6 fw-semibold" htmlFor="avail">{user.available ? 'Available' : 'Unavailable'}</label>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3"><StatCard icon={Inbox} label="Awaiting your reply" value={waiting.length} tone="amber" /></div>
        <div className="col-6 col-lg-3"><StatCard icon={FileText} label="Requests received" value={requests.length} tone="navy" /></div>
        <div className="col-6 col-lg-3"><StatCard icon={CheckCircle2} label="Accepted by you" value={accepted} tone="green" /></div>
        <div className="col-6 col-lg-3"><StatCard icon={Clock} label="Declined by you" value={declined} /></div>
      </div>

      <h5 className="mb-3">Needs your response</h5>
      {waiting.length === 0 ? (
        <EmptyState title="No open requests" text="You'll get a notification when someone near you needs your blood group." />
      ) : (
        waiting.slice(0, 4).map((r) => <MiniRequest key={r._id} r={r} />)
      )}
      {waiting.length > 0 && <Link to="/dashboard/requests" className="btn btn-outline-danger btn-sm mt-2">View all requests</Link>}
    </>
  );
}

function MiniRequest({ r }) {
  return (
    <Link to={`/dashboard/requests/${r._id}`} className={`req-card u-${r.urgency} d-flex justify-content-between align-items-center mb-2 text-decoration-none text-body`}>
      <div>
        <div className="fw-bold">{r.hospitalName}, {r.city}</div>
        <div className="small text-muted">{r.patientName} · {r.units} unit{r.units > 1 ? 's' : ''} · {timeAgo(r.createdAt)}</div>
      </div>
      <div className="d-flex gap-2 align-items-center"><UrgencyBadge urgency={r.urgency} /><BloodBadge group={r.bloodGroup} /></div>
    </Link>
  );
}

function OwnerHome() {
  const [requests, error] = useRequests();
  if (error) return <ErrorBox message={error} />;
  if (!requests) return <Loader />;
  const count = (s) => requests.filter((r) => r.status === s).length;
  return (
    <>
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3"><StatCard icon={FileText} label="Total requests" value={requests.length} tone="navy" /></div>
        <div className="col-6 col-lg-3"><StatCard icon={Clock} label="Pending" value={count('pending')} tone="amber" /></div>
        <div className="col-6 col-lg-3"><StatCard icon={HeartPulse} label="Donor accepted" value={count('accepted')} tone="red" /></div>
        <div className="col-6 col-lg-3"><StatCard icon={CheckCircle2} label="Completed" value={count('completed')} tone="green" /></div>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="m-0">Recent requests</h5>
        <Link to="/dashboard/requests/new" className="btn btn-danger btn-sm d-flex align-items-center gap-1"><PlusCircle size={15} /> New request</Link>
      </div>
      {requests.length === 0 ? (
        <EmptyState title="No requests yet" text="Create your first blood request. Matching donors are notified straight away.">
          <Link to="/dashboard/requests/new" className="btn btn-danger">Create a request</Link>
        </EmptyState>
      ) : (
        requests.slice(0, 5).map((r) => (
          <Link key={r._id} to={`/dashboard/requests/${r._id}`} className={`req-card u-${r.urgency} d-flex justify-content-between align-items-center mb-2 text-decoration-none text-body`}>
            <div>
              <div className="fw-bold">{r.patientName} · {r.hospitalName}</div>
              <div className="small text-muted">{r.matchedCount} donor{r.matchedCount !== 1 ? 's' : ''} notified · {timeAgo(r.createdAt)}</div>
            </div>
            <div className="d-flex gap-2 align-items-center"><UrgencyBadge urgency={r.urgency} /><BloodBadge group={r.bloodGroup} /><StatusBadge status={r.status} /></div>
          </Link>
        ))
      )}
    </>
  );
}

function AdminHome() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/admin/dashboard').then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loader />;
  const t = data.totals;
  return (
    <>
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-4"><StatCard icon={Users} label="Total users" value={t.totalUsers} tone="navy" /></div>
        <div className="col-6 col-lg-4"><StatCard icon={HeartPulse} label="Total donors" value={t.totalDonors} tone="red" /></div>
        <div className="col-6 col-lg-4"><StatCard icon={HeartPulse} label="Available donors" value={t.availableDonors} tone="green" /></div>
        <div className="col-6 col-lg-4"><StatCard icon={FileText} label="Total requests" value={t.totalRequests} tone="navy" /></div>
        <div className="col-6 col-lg-4"><StatCard icon={Clock} label="Pending requests" value={t.pending} tone="amber" /></div>
        <div className="col-6 col-lg-4"><StatCard icon={CheckCircle2} label="Completed requests" value={t.completed} tone="green" /></div>
        <div className="col-6 col-lg-4"><StatCard icon={Siren} label="Emergency / critical" value={t.emergency} tone="red" /></div>
        <div className="col-6 col-lg-4"><StatCard icon={Timer} label="Avg. donor response" value={fmtMinutes(data.avgResponseMinutes)} tone="navy" /></div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-4"><BarChart title="Requests (last 7 days)" data={data.perDay} color="var(--bc-navy)" /></div>
        <div className="col-lg-4"><BarChart title="Requests by blood group" data={data.requestsByGroup} /></div>
        <div className="col-lg-4"><BarChart title="Donors by blood group" data={data.donorsByGroup} color="#138a4d" /></div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="panel">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="m-0">Recent emergency requests</h6>
              <div className="d-flex align-items-center gap-3">
                <Link to="/dashboard/requests/new" className="btn btn-danger btn-sm d-flex align-items-center gap-1"><PlusCircle size={14} /> New request</Link>
                <Link to="/dashboard/requests" className="small">View all</Link>
              </div>
            </div>
            {data.recentEmergencies.length === 0 ? <p className="text-muted small mb-0">No open emergency requests.</p> : data.recentEmergencies.map((r) => (
              <Link key={r._id} to={`/dashboard/requests/${r._id}`} className={`req-card u-${r.urgency} d-flex justify-content-between align-items-center mb-2 text-decoration-none text-body`}>
                <div><div className="fw-bold">{r.hospitalName}, {r.city}</div><div className="small text-muted">{r.patientName} · {timeAgo(r.createdAt)}</div></div>
                <div className="d-flex gap-2"><UrgencyBadge urgency={r.urgency} /><BloodBadge group={r.bloodGroup} /><StatusBadge status={r.status} /></div>
              </Link>
            ))}
          </div>
        </div>
        <div className="col-lg-4">
          <BarChart title="Requests by urgency" data={data.byUrgency} color="#ff8a00" />
          <p className="small text-muted mt-2">Average response time is based on {data.respondedRequests} request{data.respondedRequests !== 1 ? 's' : ''} that received at least one donor response.</p>
        </div>
      </div>
    </>
  );
}
