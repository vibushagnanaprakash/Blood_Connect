import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Search, Navigation, Lock } from 'lucide-react';
import api, { errMsg } from '../services/api.js';
import { BLOOD_GROUPS, getLocation, fmtDate, DISCLAIMER } from '../utils/constants.js';
import { Loader, EmptyState, ErrorBox, BloodBadge } from '../components/ui.jsx';

export default function DonorSearch() {
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({ bloodGroup: params.get('bloodGroup') || '', city: params.get('city') || '', available: 'true' });
  const [coords, setCoords] = useState(null);
  const [donors, setDonors] = useState(null);
  const [error, setError] = useState('');

  const search = async (f = filters, c = coords) => {
    setDonors(null);
    setError('');
    try {
      const { data } = await api.get('/donors/search', { params: { ...f, lat: c?.lat, lng: c?.lng } });
      setDonors(data.donors);
    } catch (e) {
      setError(errMsg(e));
    }
  };
  useEffect(() => { search(); /* eslint-disable-next-line */ }, []);

  const nearMe = async () => {
    try {
      const c = await getLocation();
      setCoords(c);
      toast.success('Sorting by distance from you');
      search(filters, c);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const requestLink = `/dashboard/requests/new?bloodGroup=${encodeURIComponent(filters.bloodGroup)}&city=${encodeURIComponent(filters.city)}`;

  return (
    <div className="container py-5">
      <h1 className="mb-1">Find blood donors</h1>
      <p className="text-muted">Search by blood group and city. Only active donors are listed, and contact details stay private.</p>

      <form className="panel mb-4" onSubmit={(e) => { e.preventDefault(); search(); }}>
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label fw-semibold">Blood group</label>
            <select className="form-select" value={filters.bloodGroup} onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}>
              <option value="">Any</option>
              {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">City / location</label>
            <input className="form-control" placeholder="e.g. Coimbatore" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
          </div>
          <div className="col-md-2">
            <label className="form-label fw-semibold">Availability</label>
            <select className="form-select" value={filters.available} onChange={(e) => setFilters({ ...filters, available: e.target.value })}>
              <option value="true">Available only</option>
              <option value="all">All donors</option>
            </select>
          </div>
          <div className="col-md-4 d-flex gap-2">
            <button className="btn btn-danger flex-fill d-flex align-items-center justify-content-center gap-1"><Search size={16} /> Search</button>
            <button type="button" className="btn btn-outline-danger d-flex align-items-center gap-1" onClick={nearMe}><Navigation size={16} /> Near me</button>
          </div>
        </div>
      </form>

      {error && <ErrorBox message={error} />}
      {!donors && !error && <Loader text="Searching donors..." />}
      {donors && donors.length === 0 && (
        <EmptyState title="No donors found" text="Try another city, remove the blood group filter, or include unavailable donors.">
          <Link to={requestLink} className="btn btn-danger">Raise a blood request instead</Link>
        </EmptyState>
      )}
      {donors && donors.length > 0 && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <strong>{donors.length} donor{donors.length > 1 ? 's' : ''} found{coords ? ' · nearest first' : ''}</strong>
            <Link to={requestLink} className="btn btn-danger btn-sm">Send a blood request</Link>
          </div>
          <div className="row g-3">
            {donors.map((d) => (
              <div className="col-md-6 col-lg-4" key={d._id}>
                <div className="donor-card">
                  <div className="d-flex gap-3 align-items-center mb-2">
                    <div className="avatar">{d.name[0]}</div>
                    <div className="flex-grow-1">
                      <div className="fw-bold">{d.name}</div>
                      <div className="small text-muted d-flex align-items-center gap-1"><MapPin size={13} /> {d.area ? `${d.area}, ` : ''}{d.city}</div>
                    </div>
                    <BloodBadge group={d.bloodGroup} size="lg" />
                  </div>
                  <div className="d-flex justify-content-between small mb-2">
                    <span className={d.available ? 'text-success fw-semibold' : 'text-muted'}>{d.available ? '● Available' : '○ Unavailable'}</span>
                    {d.distanceKm != null && <span className="text-muted">{d.distanceKm} km away</span>}
                  </div>
                  {d.lastDonationDate && <div className="small text-muted mb-2">Last donated: {fmtDate(d.lastDonationDate)}</div>}
                  <div className="small text-muted d-flex align-items-center gap-1"><Lock size={12} /> Contact shared after the donor accepts</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="notice mt-4">{DISCLAIMER}</div>
    </div>
  );
}
