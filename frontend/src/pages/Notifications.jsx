import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, CheckCheck } from 'lucide-react';
import api, { errMsg } from '../services/api.js';
import { Loader, ErrorBox, EmptyState } from '../components/ui.jsx';
import { timeAgo } from '../utils/constants.js';

export default function Notifications() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/notifications').then((r) => setItems(r.data.notifications)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const markAll = async () => {
    try { await api.put('/notifications/read-all'); toast.success('All marked as read'); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const markOne = (n) => { if (!n.read) api.put(`/notifications/${n._id}/read`).then(load).catch(() => {}); };

  if (error) return <ErrorBox message={error} />;
  if (!items) return <Loader />;
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">Notifications</h2>
        {items.some((n) => !n.read) && <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={markAll}><CheckCheck size={15} /> Mark all as read</button>}
      </div>
      {items.length === 0 ? <EmptyState title="You're all caught up" text="New blood requests and responses will show up here." /> : (
        <div className="d-grid gap-2">
          {items.map((n) => (
            <div key={n._id} className={`notif ${n.read ? '' : 'unread'}`}>
              <Bell size={18} className="text-danger mt-1" />
              <div className="flex-grow-1">
                <div>{n.message}</div>
                <div className="small text-muted">{timeAgo(n.createdAt)}</div>
              </div>
              {n.request && <Link to={`/dashboard/requests/${n.request}`} className="btn btn-light btn-sm" onClick={() => markOne(n)}>View</Link>}
              {!n.read && !n.request && <button className="btn btn-light btn-sm" onClick={() => markOne(n)}>Mark read</button>}
            </div>
          ))}
        </div>
      )}
      <p className="small text-muted mt-3">Notifications refresh when you open this page and the bell updates every 30 seconds.</p>
    </>
  );
}
