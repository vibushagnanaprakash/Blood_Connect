import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container text-center py-5">
      <div className="brand-text" style={{ fontSize: '5rem', color: 'var(--bc-red)' }}>404</div>
      <h3>This page doesn't exist</h3>
      <p className="text-muted">The link may be broken or the page may have moved.</p>
      <Link to="/" className="btn btn-danger">Back to home</Link>
    </div>
  );
}
