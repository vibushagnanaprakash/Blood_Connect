export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export const timeAgo = (d) => {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
};

export const fmtMinutes = (m) => {
  if (m == null) return '—';
  if (m < 60) return `${Math.round(m)} min`;
  return `${Math.floor(m / 60)} hr ${Math.round(m % 60)} min`;
};

export const getLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location is not supported by this browser'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: Math.round(p.coords.latitude * 10000) / 10000, lng: Math.round(p.coords.longitude * 10000) / 10000 }),
      () => reject(new Error('Location permission was denied'))
    );
  });

export const DISCLAIMER =
  'BloodConnect only helps people find each other. Donor eligibility and blood compatibility must always be verified by authorised medical professionals.';
