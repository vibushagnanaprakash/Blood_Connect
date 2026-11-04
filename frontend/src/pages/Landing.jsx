import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Siren, Search, UserPlus, Bell, HeartHandshake, MapPin, ShieldCheck, Clock } from 'lucide-react';
import api from '../services/api.js';
import { BLOOD_GROUPS, DISCLAIMER } from '../utils/constants.js';

export default function Landing() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/stats/public').then((r) => setStats(r.data)).catch(() => setStats(null));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container py-5 position-relative" style={{ zIndex: 1 }}>
          <div className="row align-items-center g-5 py-lg-4">
            <div className="col-lg-7">
              <h1>When every minute counts, find a blood donor in minutes.</h1>
              <p className="lead mt-3">BloodConnect links patients and hospitals with available donors nearby, notifies them instantly and tracks every response until the blood is arranged.</p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <Link to="/dashboard/requests/new" className="btn btn-danger btn-lg d-flex align-items-center gap-2"><Siren size={20} /> Request blood now</Link>
                <Link to="/donors" className="btn btn-outline-light btn-lg d-flex align-items-center gap-2"><Search size={20} /> Find a donor</Link>
              </div>
              <p className="small mt-3 mb-0" style={{ color: '#9fb0d3' }}>Free to use. Donor phone numbers are shared only after a donor accepts.</p>
            </div>
            <div className="col-lg-5">
              <div className="alert-card">
                <div className="d-flex align-items-center gap-2 mb-2"><span className="pulse-dot" /><strong className="text-danger">Critical request</strong></div>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold fs-5">O- · 2 units</div>
                    <div className="text-muted small">KMCH Hospital, Coimbatore</div>
                  </div>
                  <div className="brand-text" style={{ fontSize: '2.4rem', color: 'var(--bc-red)' }}>O−</div>
                </div>
                <hr />
                <div className="small d-flex justify-content-between"><span>Donors notified</span><strong>8 nearby</strong></div>
                <div className="small d-flex justify-content-between"><span>First response</span><strong>12 min</strong></div>
                <div className="small text-muted mt-2">Example of what a request looks like on your dashboard.</div>
              </div>
            </div>
          </div>
        </div>
        <svg className="ecg" viewBox="0 0 1200 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 50 H300 L330 50 L350 15 L380 82 L405 30 L425 50 H700 L725 50 L745 20 L775 80 L800 35 L820 50 H1200" fill="none" stroke="#d62839" strokeWidth="3" />
        </svg>
      </section>

      <section className="section-white py-4 border-bottom">
        <div className="container">
          <div className="row text-center g-3">
            {[['Registered donors', stats?.totalDonors], ['Available right now', stats?.availableDonors], ['Requests raised', stats?.totalRequests], ['Requests completed', stats?.completedRequests]].map(([label, val]) => (
              <div className="col-6 col-md-3" key={label}>
                <div className="stat-value">{val ?? '—'}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="mb-1">Looking for a specific blood group?</h2>
          <p className="text-muted mb-4">Tap a group to see available donors.</p>
          <div className="row g-3">
            {BLOOD_GROUPS.map((g) => (
              <div className="col-3 col-md-3 col-lg-auto flex-lg-fill" key={g}>
                <Link to={`/donors?bloodGroup=${encodeURIComponent(g)}`} className="group-tile">{g}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="container">
          <h2 className="mb-4">How BloodConnect works</h2>
          <div className="row g-4">
            {[
              [UserPlus, 'Donors register', 'Add your blood group and city once, then switch Available or Unavailable whenever you like.'],
              [Siren, 'Patients raise a request', 'Enter patient, hospital, units and urgency. Emergency requests jump to the top of every list.'],
              [Bell, 'Matching donors are notified', 'Available donors with the same blood group are alerted, nearest first when location is known.'],
              [HeartHandshake, 'Accept, track, complete', 'The first donor to accept is shown to you with contact details, and the status is tracked to completion.'],
            ].map(([Icon, title, text], i) => (
              <div className="col-md-6 col-lg-3" key={title}>
                <div className="step-circle mb-3"><Icon size={20} /></div>
                <h5>{title}</h5>
                <p className="text-muted small mb-0">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="row g-4">
            {[
              [MapPin, 'Nearest donors first', 'Distances are calculated with the Haversine formula when coordinates are available.'],
              [Clock, 'Response-time analytics', 'Admins can see how quickly donors respond, so the platform keeps getting faster.'],
              [ShieldCheck, 'Privacy by design', 'Donor phone and email stay hidden until the donor accepts your request.'],
            ].map(([Icon, title, text]) => (
              <div className="col-md-4" key={title}>
                <div className="panel h-100">
                  <Icon className="text-danger mb-2" />
                  <h5>{title}</h5>
                  <p className="text-muted small mb-0">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="notice mt-4">{DISCLAIMER}</div>
        </div>
      </section>

      <section className="section-white py-5 text-center">
        <div className="container">
          <h2>Ready to save a life?</h2>
          <p className="text-muted">Register as a donor in under a minute.</p>
          <Link to="/register" className="btn btn-danger btn-lg">Become a donor</Link>
        </div>
      </section>
    </>
  );
}
