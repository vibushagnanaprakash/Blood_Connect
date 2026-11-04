import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Droplet, LogOut, Menu, X, Siren, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

export function Brand({ light }) {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark"><Droplet size={18} fill="currentColor" /></span>
      <span className="brand-text" style={light ? { color: '#fff' } : undefined}>Blood<b>Connect</b></span>
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Simple polling for notifications (every 30 seconds) - works without any extra server
  useEffect(() => {
    if (!user) return undefined;
    const load = () => api.get('/notifications/unread-count').then((r) => setUnread(r.data.count)).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [user]);

  const close = () => setOpen(false);
  const canRequest = user && ['requester', 'hospital', 'admin'].includes(user.role);
  const link = ({ isActive }) => `nav-link-bc ${isActive ? 'active' : ''}`;

  return (
    <nav className="bc-nav">
      <div className="container d-flex align-items-center justify-content-between py-2">
        <Brand />
        <button className="btn d-lg-none" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
        <div className={`nav-menu ${open ? 'open' : ''}`}>
          <NavLink to="/" end className={link} onClick={close}>Home</NavLink>
          <NavLink to="/donors" className={link} onClick={close}>Find donors</NavLink>
          <NavLink to="/about" className={link} onClick={close}>How it works</NavLink>
          {user ? (
            <>
              <Link to={canRequest ? '/dashboard/requests/new' : '/dashboard'} className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={close}>
                {canRequest ? <><Siren size={15} /> Request blood</> : <><LayoutDashboard size={15} /> Dashboard</>}
              </Link>
              <Link to="/dashboard/notifications" className="position-relative btn btn-light btn-sm" onClick={close} aria-label="Notifications">
                <Bell size={17} />{unread > 0 && <span className="bell-dot">{unread}</span>}
              </Link>
              <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={() => { close(); logout(); navigate('/'); }}>
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={link} onClick={close}>Login</NavLink>
              <Link to="/register" className="btn btn-outline-danger btn-sm" onClick={close}>Register</Link>
              <Link to="/dashboard/requests/new" className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={close}><Siren size={15} /> Emergency request</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
