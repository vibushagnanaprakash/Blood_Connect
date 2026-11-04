import { Droplet, Inbox, AlertTriangle } from 'lucide-react';

export function Loader({ text = 'Loading...' }) {
  return (
    <div className="text-center py-5 text-muted">
      <div className="spinner-border text-danger mb-3" role="status" />
      <div>{text}</div>
    </div>
  );
}

export function EmptyState({ title, text, children }) {
  return (
    <div className="empty-state text-center py-5 px-3">
      <Inbox size={40} className="text-muted mb-3" />
      <h5 className="mb-1">{title}</h5>
      {text && <p className="text-muted mb-3">{text}</p>}
      {children}
    </div>
  );
}

export function ErrorBox({ message }) {
  return (
    <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
      <AlertTriangle size={18} /> {message}
    </div>
  );
}

const STATUS_CLASS = { pending: 'bg-warning text-dark', accepted: 'bg-primary', completed: 'bg-success', cancelled: 'bg-secondary' };
export const StatusBadge = ({ status }) => <span className={`badge text-capitalize ${STATUS_CLASS[status] || 'bg-dark'}`}>{status}</span>;

export const UrgencyBadge = ({ urgency }) =>
  urgency === 'normal' ? (
    <span className="badge bg-light text-dark border">Normal</span>
  ) : (
    <span className={`badge urgency-${urgency} text-uppercase`}>{urgency}</span>
  );

export const BloodBadge = ({ group, size = 'md' }) => (
  <span className={`blood-badge blood-badge-${size}`}>
    <Droplet size={size === 'lg' ? 18 : 12} fill="currentColor" /> {group}
  </span>
);

export function StatCard({ icon: Icon, label, value, tone = 'red' }) {
  return (
    <div className="stat-card h-100">
      <div className={`stat-icon tone-${tone}`}><Icon size={20} /></div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// Simple horizontal bar chart made with CSS (no chart library needed)
export function BarChart({ title, data = [], color = 'var(--bc-red)', labelWidth }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const longestLabel = data.reduce((m, d) => Math.max(m, String(d.label || '').length), 0);
  const calculatedWidth = labelWidth || (longestLabel > 5 ? `${Math.max(86, Math.ceil(longestLabel * 9.5))}px` : '52px');

  return (
    <div className="panel h-100">
      <h6 className="mb-3">{title}</h6>
      {data.length === 0 ? (
        <p className="text-muted small mb-0">No data yet.</p>
      ) : (
        data.map((d) => (
          <div className="bar-row" key={d.label}>
            <span className="bar-label" style={{ width: calculatedWidth, minWidth: calculatedWidth }}>
              {d.label}
            </span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
            </div>
            <span className="bar-value">{d.value}</span>
          </div>
        ))
      )}
    </div>
  );
}
