import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, Users, Bell, UserCircle, Search } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = {
  donor: [['/dashboard', 'Overview', LayoutDashboard, true], ['/dashboard/requests', 'Blood requests', FileText], ['/dashboard/notifications', 'Notifications', Bell], ['/dashboard/profile', 'My profile', UserCircle]],
  requester: [['/dashboard', 'Overview', LayoutDashboard, true], ['/dashboard/requests/new', 'New request', PlusCircle], ['/dashboard/requests', 'My requests', FileText], ['/donors', 'Find donors', Search], ['/dashboard/notifications', 'Notifications', Bell], ['/dashboard/profile', 'My profile', UserCircle]],
  admin: [['/dashboard', 'Overview', LayoutDashboard, true], ['/dashboard/requests/new', 'New request', PlusCircle], ['/dashboard/requests', 'All requests', FileText], ['/dashboard/users', 'Users & donors', Users], ['/dashboard/notifications', 'Notifications', Bell], ['/dashboard/profile', 'My profile', UserCircle]],
};
LINKS.hospital = LINKS.requester;

export default function DashboardLayout() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <div className="dash">
        <aside className="sidebar">
          <div className="side-user mb-4 px-2">
            <div className="small text-uppercase" style={{ color: '#8fa0c4', letterSpacing: '.06em' }}>{user.role}</div>
            <div className="fw-bold">{user.hospitalName || user.name}</div>
          </div>
          {LINKS[user.role].map(([to, label, Icon, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </aside>
        <main className="dash-main"><Outlet /></main>
      </div>
    </>
  );
}
