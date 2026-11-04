import User, { BLOOD_GROUPS } from '../models/User.js';
import BloodRequest from '../models/BloodRequest.js';
import Notification from '../models/Notification.js';
import { wrap, httpError, cleanCoords } from '../utils/helpers.js';
import { findDonors } from '../utils/matching.js';
import { applyProfileUpdates } from '../utils/profile.js';

// GET /api/donors and /api/donors/search  (public)
// query: bloodGroup, city, available=true|all, lat, lng
export const searchDonors = wrap(async (req, res) => {
  const { bloodGroup, city, available = 'true', lat, lng } = req.query;
  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) throw httpError(400, 'Invalid blood group');
  const donors = await findDonors({
    bloodGroup,
    city,
    coords: cleanCoords({ lat, lng }),
    availableOnly: available !== 'all',
    limit: 100,
  });
  res.json({ count: donors.length, donors });
});

// GET /api/donors/:id  (logged in) - public profile only, contact details for admin
export const getDonor = wrap(async (req, res) => {
  const donor = await User.findOne({ _id: req.params.id, role: 'donor' });
  if (!donor) throw httpError(404, 'Donor not found');
  const o = donor.toObject();
  if (req.user.role !== 'admin') {
    delete o.email; delete o.phone; delete o.coordinates; delete o.isActive;
  }
  res.json({ donor: o });
});

// PUT /api/donors/:id  (self or admin)
export const updateDonor = wrap(async (req, res) => {
  const donor = await User.findOne({ _id: req.params.id, role: 'donor' });
  if (!donor) throw httpError(404, 'Donor not found');
  if (req.user.role !== 'admin' && !donor._id.equals(req.user._id)) throw httpError(403, 'You can only edit your own profile');
  applyProfileUpdates(donor, req.body);
  await donor.save({ validateModifiedOnly: true });
  res.json({ donor });
});

// DELETE /api/donors/:id  (self or admin)
export const deleteDonor = wrap(async (req, res) => {
  const donor = await User.findOne({ _id: req.params.id, role: 'donor' });
  if (!donor) throw httpError(404, 'Donor not found');
  if (req.user.role !== 'admin' && !donor._id.equals(req.user._id)) throw httpError(403, 'You can only delete your own account');
  await Notification.deleteMany({ recipient: donor._id });
  await BloodRequest.updateMany({ matchedDonors: donor._id }, { $pull: { matchedDonors: donor._id } });
  await donor.deleteOne();
  res.json({ message: 'Donor deleted' });
});
