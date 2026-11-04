import User from '../models/User.js';
import BloodRequest from '../models/BloodRequest.js';
import Notification from '../models/Notification.js';
import { wrap, httpError, escapeRegex } from '../utils/helpers.js';

// GET /api/stats/public  (landing page numbers, no login needed)
export const publicStats = wrap(async (_req, res) => {
  const [totalDonors, availableDonors, totalRequests, completedRequests] = await Promise.all([
    User.countDocuments({ role: 'donor', isActive: true }),
    User.countDocuments({ role: 'donor', isActive: true, available: true }),
    BloodRequest.countDocuments(),
    BloodRequest.countDocuments({ status: 'completed' }),
  ]);
  res.json({ totalDonors, availableDonors, totalRequests, completedRequests });
});

// GET /api/admin/stats  (dashboard cards + analytics)
export const dashboard = wrap(async (_req, res) => {
  const weekAgo = new Date(Date.now() - 6 * 24 * 3600 * 1000);
  weekAgo.setHours(0, 0, 0, 0);
  const [totalUsers, totalDonors, availableDonors, totalRequests, pending, accepted, completed, cancelled, emergency, avg, donorsByGroup, requestsByGroup, byUrgency, perDay, recentEmergencies] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'donor', available: true, isActive: true }),
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: 'pending' }),
      BloodRequest.countDocuments({ status: 'accepted' }),
      BloodRequest.countDocuments({ status: 'completed' }),
      BloodRequest.countDocuments({ status: 'cancelled' }),
      BloodRequest.countDocuments({ urgency: { $in: ['emergency', 'critical'] } }),
      BloodRequest.aggregate([{ $match: { firstResponseMinutes: { $ne: null } } }, { $group: { _id: null, avg: { $avg: '$firstResponseMinutes' }, n: { $sum: 1 } } }]),
      User.aggregate([{ $match: { role: 'donor' } }, { $group: { _id: '$bloodGroup', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      BloodRequest.aggregate([{ $group: { _id: '$bloodGroup', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      BloodRequest.aggregate([{ $group: { _id: '$urgency', count: { $sum: 1 } } }]),
      BloodRequest.aggregate([{ $match: { createdAt: { $gte: weekAgo } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      BloodRequest.find({ urgency: { $in: ['emergency', 'critical'] }, status: { $in: ['pending', 'accepted'] } })
        .sort({ createdAt: -1 }).limit(6).populate('requester', 'name'),
    ]);

  res.json({
    totals: { totalUsers, totalDonors, availableDonors, totalRequests, pending, accepted, completed, cancelled, emergency },
    avgResponseMinutes: avg[0] ? Math.round(avg[0].avg * 10) / 10 : null,
    respondedRequests: avg[0]?.n || 0,
    donorsByGroup: donorsByGroup.map((x) => ({ label: x._id, value: x.count })),
    requestsByGroup: requestsByGroup.map((x) => ({ label: x._id, value: x.count })),
    byUrgency: byUrgency.map((x) => ({ label: x._id, value: x.count })),
    perDay: perDay.map((x) => ({ label: x._id.slice(5), value: x.count })),
    recentEmergencies,
  });
});

// GET /api/admin/users?q=&role=&active=
export const listUsers = wrap(async (req, res) => {
  const { q, role, active } = req.query;
  const filter = {};
  if (role && role !== 'all') filter.role = role;
  if (active === 'true' || active === 'false') filter.isActive = active === 'true';
  if (q) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { city: rx }, { phone: rx }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(300);
  res.json({ count: users.length, users });
});

// PATCH /api/admin/users/:id/active  body: { isActive: boolean }
export const setUserActive = wrap(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  if (user._id.equals(req.user._id)) throw httpError(400, 'You cannot deactivate your own account');
  user.isActive = typeof req.body.isActive === 'boolean' ? req.body.isActive : !user.isActive;
  await user.save({ validateModifiedOnly: true });
  res.json({ message: user.isActive ? 'User activated' : 'User deactivated', user });
});

// DELETE /api/admin/users/:id
export const deleteUser = wrap(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  if (user._id.equals(req.user._id)) throw httpError(400, 'You cannot delete your own account');
  if (user.role === 'admin') throw httpError(400, 'Admin accounts cannot be deleted here');
  await Notification.deleteMany({ recipient: user._id });
  await BloodRequest.updateMany({ matchedDonors: user._id }, { $pull: { matchedDonors: user._id } });
  if (['requester', 'hospital'].includes(user.role)) {
    const ids = (await BloodRequest.find({ requester: user._id }).select('_id')).map((r) => r._id);
    await Notification.deleteMany({ request: { $in: ids } });
    await BloodRequest.deleteMany({ requester: user._id });
  }
  await user.deleteOne();
  res.json({ message: 'User deleted' });
});
