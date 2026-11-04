// Small helper functions used across controllers

// Wrap async route handlers so errors go to the central error handler
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const URGENCY_RANK = { critical: 0, emergency: 1, normal: 2 };

// Sort: critical first, then emergency, then normal; newest first inside each group
export const sortByUrgency = (list) =>
  [...list].sort((a, b) => {
    const diff = (URGENCY_RANK[a.urgency] ?? 3) - (URGENCY_RANK[b.urgency] ?? 3);
    return diff !== 0 ? diff : new Date(b.createdAt) - new Date(a.createdAt);
  });

// Haversine formula: distance in km between two {lat, lng} points
export function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Returns {lat,lng} if valid numbers, otherwise null
export function cleanCoords(c) {
  if (!c || c.lat === '' || c.lng === '' || c.lat == null || c.lng == null) return null;
  const lat = Number(c.lat);
  const lng = Number(c.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}
