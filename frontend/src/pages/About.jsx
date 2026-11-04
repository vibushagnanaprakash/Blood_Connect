import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { DISCLAIMER } from '../utils/constants.js';

const FAQ = [
  ['Who can use BloodConnect?', 'Donors, patients/families (requesters) and hospitals each get their own dashboard. Administrators manage the platform.'],
  ['Is my phone number public?', 'No. Donor contact details are never listed. A requester sees a donor\'s phone only after that donor accepts the request.'],
  ['How are donors matched?', 'By blood group and availability. If both sides have saved coordinates, donors are sorted by distance; otherwise matching uses the city.'],
  ['Can I cancel a request?', 'Yes. A pending or accepted request can be cancelled from the request page.'],
];

export default function About() {
  return (
    <div className="container py-5">
      <h1 className="mb-2">How it works</h1>
      <p className="text-muted mb-5" style={{ maxWidth: 640 }}>BloodConnect is a simple coordination tool: it helps the right people find each other quickly. It does not store blood or perform any medical checks.</p>

      <div className="row g-4 mb-5">
        {[
          ['For donors', 'Register with your blood group and city. Keep your availability up to date. When a matching request appears you get an in-app notification and can accept or decline.'],
          ['For patients and families', 'Create a request with the hospital, units and urgency. Matching donors are notified automatically. You can also search donors and send the request to specific people.'],
          ['For hospitals', 'Hospital accounts raise and track requests for their patients and see exactly which donors accepted or declined.'],
        ].map(([t, d]) => (
          <div className="col-md-4" key={t}><div className="panel h-100"><h5>{t}</h5><p className="text-muted mb-0">{d}</p></div></div>
        ))}
      </div>

      <h3 className="mb-3">Frequently asked questions</h3>
      <div className="accordion mb-5" id="faq">
        {FAQ.map(([q, a], i) => (
          <details className="panel mb-2" key={q} open={i === 0}>
            <summary className="fw-bold">{q}</summary>
            <p className="text-muted mt-2 mb-0">{a}</p>
          </details>
        ))}
      </div>

      <h3 className="mb-3" id="contact">Contact</h3>
      <div className="row g-3 mb-4">
        <div className="col-md-4"><div className="panel d-flex gap-2 align-items-center"><Mail className="text-danger" /> support@bloodconnect.example</div></div>
        <div className="col-md-4"><div className="panel d-flex gap-2 align-items-center"><Phone className="text-danger" /> 1800-000-0000 (demo number)</div></div>
        <div className="col-md-4"><div className="panel d-flex gap-2 align-items-center"><MapPin className="text-danger" /> Coimbatore, Tamil Nadu</div></div>
      </div>
      <div className="notice mb-4">{DISCLAIMER}</div>
      <Link to="/register" className="btn btn-danger">Join BloodConnect</Link>
    </div>
  );
}
