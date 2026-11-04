import { cleanCoords } from './helpers.js';

// Copies only the fields a user is allowed to change onto the user document
export function applyProfileUpdates(user, body) {
  const fields = ['name', 'phone', 'city', 'area'];
  if (user.role === 'hospital') fields.push('hospitalName');
  if (user.role === 'donor') fields.push('bloodGroup', 'available', 'lastDonationDate');
  for (const f of fields) {
    if (body[f] === undefined) continue;
    user[f] = body[f] === '' && f === 'lastDonationDate' ? undefined : body[f];
  }
  if (body.coordinates !== undefined) user.coordinates = cleanCoords(body.coordinates) || undefined;
}
