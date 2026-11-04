import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2, UserCheck, UserX } from 'lucide-react';
import api, { errMsg } from '../services/api.js';
import { Loader, ErrorBox, EmptyState, BloodBadge } from '../components/ui.jsx';
import { fmtDate } from '../utils/constants.js';

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', role: 'all', active: 'all' });

  const load = () => {
    setError('');
    api.get('/admin/users', { params: filters }).then((r) => setUsers(r.data.users)).catch((e) => setError(errMsg(e)));
  };
  useEffect(load, [filters.role, filters.active]); // eslint-disable-line

  const toggle = async (u) => {
    try { const { data } = await api.patch(`/admin/users/${u._id}/active`, { isActive: !u.isActive }); toast.success(data.message); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? Their requests and notifications are removed too.`)) return;
    try { await api.delete(`/admin/users/${u._id}`); toast.success('User deleted'); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <h2 className="mb-3">Users & donors</h2>
      <form className="panel mb-3" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <div className="row g-2">
          <div className="col-md-5"><input className="form-control" placeholder="Search name, email, phone or city" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></div>
          <div className="col-6 col-md-3">
            <select className="form-select" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
              <option value="all">All roles</option><option value="donor">Donors</option><option value="requester">Requesters</option><option value="hospital">Hospitals</option><option value="admin">Admins</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value })}>
              <option value="all">Any status</option><option value="true">Active</option><option value="false">Deactivated</option>
            </select>
          </div>
          <div className="col-md-2"><button className="btn btn-navy w-100">Search</button></div>
        </div>
      </form>

      {error && <ErrorBox message={error} />}
      {!users && !error && <Loader />}
      {users && users.length === 0 && <EmptyState title="No users found" text="Try different filters." />}
      {users && users.length > 0 && (
        <div className="panel p-0 table-responsive">
          <table className="table align-middle mb-0">
            <thead><tr><th>Name</th><th>Role</th><th>Group</th><th>City</th><th>Contact</th><th>Joined</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className={u.isActive ? '' : 'table-secondary'}>
                  <td className="fw-semibold">{u.hospitalName || u.name}<div className="small text-muted">{u.email}</div></td>
                  <td className="text-capitalize">{u.role}</td>
                  <td>{u.bloodGroup ? <BloodBadge group={u.bloodGroup} /> : '—'}</td>
                  <td>{u.city}</td>
                  <td className="small">{u.phone}</td>
                  <td className="small text-muted">{fmtDate(u.createdAt)}</td>
                  <td>{u.role === 'donor' && <div className={`small ${u.available ? 'text-success' : 'text-muted'}`}>{u.available ? 'Available' : 'Unavailable'}</div>}<span className={`badge ${u.isActive ? 'bg-success' : 'bg-secondary'}`}>{u.isActive ? 'Active' : 'Deactivated'}</span></td>
                  <td className="text-end text-nowrap">
                    {u.role !== 'admin' && (
                      <>
                        {u.role === 'donor' && u.isActive && (
                          <Link
                            to={`/dashboard/requests/new?bloodGroup=${encodeURIComponent(u.bloodGroup || '')}&city=${encodeURIComponent(u.city || '')}`}
                            className="btn btn-outline-danger btn-sm me-1"
                            title="Create blood request for this donor's blood group"
                          >
                            Request
                          </Link>
                        )}
                        <button className="btn btn-outline-secondary btn-sm me-1" onClick={() => toggle(u)} title={u.isActive ? 'Deactivate' : 'Activate'}>{u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}</button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => remove(u)} title="Delete"><Trash2 size={15} /></button>
                      </>
                    )}
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
