import BloodRequest from '../models/BloodRequest.js';
import User, { BLOOD_GROUPS } from '../models/User.js';
import Notification from '../models/Notification.js';
import { wrap, httpError, escapeRegex, sortByUrgency, cleanCoords } from '../utils/helpers.js';
import { findDonors, COMPATIBLE_DONORS_FOR_RECIPIENT, RECIPIENTS_FOR_DONOR } from '../utils/matching.js';
import { notify, notifyMany } from '../utils/notify.js';

// Allowed status changes (a request can only move forward along these paths)
const TRANSITIONS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const withRefs = (q) =>
  q
    .populate('requester', 'name role hospitalName')
    .populate('acceptedDonor', 'name phone email bloodGroup city area')
    .populate('responses.donor', 'name bloodGroup city area');

// Hide data the viewer should not see (privacy rules)
function serialize(doc, viewer) {
  const o = doc.toObject();
  const idOf = (x) => String(x?._id || x);
  const isAdmin = viewer.role === 'admin';
  const contactOpen = ['accepted', 'completed'].includes(o.status);
  o.matchedCount = o.matchedDonors?.length || 0;

  if (viewer.role === 'donor') {
    const mine = (o.responses || []).find((x) => idOf(x.donor) === String(viewer._id));
    o.myResponse = mine?.response || null;
    const iAccepted = o.acceptedDonor && idOf(o.acceptedDonor) === String(viewer._id);
    if (!(iAccepted && contactOpen)) delete o.contactNumber; // contact shared only with the accepted donor
    o.acceptedDonor = iAccepted ? { _id: viewer._id } : undefined;
    delete o.responses;
    delete o.matchedDonors;
  } else if (!isAdmin) {
    delete o.matchedDonors;
    if (o.acceptedDonor && !contactOpen) {
      delete o.acceptedDonor.phone;
      delete o.acceptedDonor.email;
    }
  }
  return o;
}

// POST /api/requests  (requester, hospital)
export const createRequest = wrap(async (req, res) => {
  const b = req.body;
  for (const f of ['patientName', 'bloodGroup', 'hospitalName', 'city', 'contactNumber', 'requiredDate']) {
    if (!b[f] || !String(b[f]).trim()) throw httpError(400, `${f} is required`);
  }
  if (!BLOOD_GROUPS.includes(b.bloodGroup)) throw httpError(400, 'Invalid blood group');
  const units = Number(b.units || 1);
  if (!Number.isInteger(units) || units < 1 || units > 10) throw httpError(400, 'Units must be between 1 and 10');
  const date = new Date(b.requiredDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(date)) throw httpError(400, 'Invalid required date');
  if (date < today) throw httpError(400, 'Required date cannot be in the past');
  const urgency = ['normal', 'emergency', 'critical'].includes(b.urgency) ? b.urgency : 'normal';
  const coordinates = cleanCoords(b.coordinates) || undefined;

  const request = await BloodRequest.create({
    requester: req.user._id,
    patientName: b.patientName, bloodGroup: b.bloodGroup, units,
    hospitalName: b.hospitalName, city: b.city, area: b.area,
    contactNumber: b.contactNumber, requiredDate: date, urgency,
    notes: b.notes, coordinates,
  });

  // Auto-match available donors with the same blood group (nearest first if coordinates exist)
  const donors = await findDonors({ bloodGroup: b.bloodGroup, city: b.city, coords: coordinates, limit: 30, exclude: req.user._id });
  request.matchedDonors = donors.map((d) => d._id);
  await request.save();

  const tag = urgency === 'normal' ? 'Blood needed' : urgency.toUpperCase() + ' blood request';
  await notifyMany(request.matchedDonors, request._id, `${tag}: ${b.bloodGroup} at ${b.hospitalName}, ${b.city}.`, 'new_request');

  res.status(201).json({ request: serialize(await withRefs(BloodRequest.findById(request._id)), req.user), notifiedDonors: donors.length });
});

// GET /api/requests - result depends on the role
//   requester/hospital -> own requests, donor -> requests sent to them or open compatible requests, admin -> everything
export const listRequests = wrap(async (req, res) => {
  const { status, urgency, q } = req.query;
  const filter = {};
  if (req.user.role === 'donor') {
    const eligibleRecipientGroups = req.user.bloodGroup ? (RECIPIENTS_FOR_DONOR[req.user.bloodGroup] || [req.user.bloodGroup]) : [];
    filter.$or = [
      { matchedDonors: req.user._id },
      { bloodGroup: { $in: eligibleRecipientGroups }, status: 'pending' },
    ];
  } else if (req.user.role !== 'admin') {
    filter.requester = req.user._id;
  }
  if (status && status !== 'all') filter.status = status;
  if (urgency && urgency !== 'all') filter.urgency = urgency;
  if (q) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    const searchConditions = [{ patientName: rx }, { hospitalName: rx }, { city: rx }];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
      delete filter.$or;
    } else {
      filter.$or = searchConditions;
    }
  }
  const docs = await withRefs(BloodRequest.find(filter).sort({ createdAt: -1 }).limit(300));
  const list = sortByUrgency(docs.map((d) => serialize(d, req.user)));
  res.json({ count: list.length, requests: list });
});

// GET /api/requests/:id
export const getRequest = wrap(async (req, res) => {
  const doc = await withRefs(BloodRequest.findById(req.params.id));
  if (!doc) throw httpError(404, 'Request not found');
  const isOwner = doc.requester._id.equals(req.user._id);
  const isMatched = doc.matchedDonors.some((id) => id.equals(req.user._id));
  const eligibleRecipientGroups = req.user.bloodGroup ? (RECIPIENTS_FOR_DONOR[req.user.bloodGroup] || [req.user.bloodGroup]) : [];
  const isCompatibleDonor = req.user.role === 'donor' && eligibleRecipientGroups.includes(doc.bloodGroup);
  if (req.user.role !== 'admin' && !isOwner && !isMatched && !isCompatibleDonor) throw httpError(403, 'You cannot view this request');
  res.json({ request: serialize(doc, req.user) });
});

// PUT /api/requests/:id/status  (owner or admin)
export const updateStatus = wrap(async (req, res) => {
  const { status } = req.body;
  const r = await BloodRequest.findById(req.params.id);
  if (!r) throw httpError(404, 'Request not found');
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !r.requester.equals(req.user._id)) throw httpError(403, 'You can only update your own requests');
  if (!TRANSITIONS[r.status]?.includes(status)) throw httpError(400, `Cannot change status from ${r.status} to ${status}`);
  if (!isAdmin && status === 'accepted') throw httpError(403, 'Only a donor can accept a request');

  r.status = status;
  if (status === 'completed') r.completedAt = new Date();
  await r.save();

  const msg = `Request for ${r.patientName} (${r.bloodGroup}) is now ${status}.`;
  if (isAdmin && !r.requester.equals(req.user._id)) await notify(r.requester, r._id, msg, 'status');
  if (r.acceptedDonor && ['completed', 'cancelled'].includes(status)) await notify(r.acceptedDonor, r._id, msg, 'status');

  res.json({ message: `Request marked as ${status}`, request: serialize(await withRefs(BloodRequest.findById(r._id)), req.user) });
});

// POST /api/requests/:id/respond  (donor) body: { response: 'accepted' | 'declined' }
export const respondToRequest = wrap(async (req, res) => {
  const { response } = req.body;
  if (!['accepted', 'declined'].includes(response)) throw httpError(400, 'Response must be accepted or declined');
  const r = await BloodRequest.findById(req.params.id);
  if (!r) throw httpError(404, 'Request not found');
  const isMatched = r.matchedDonors.some((id) => id.equals(req.user._id));
  const eligibleRecipientGroups = req.user.bloodGroup ? (RECIPIENTS_FOR_DONOR[req.user.bloodGroup] || [req.user.bloodGroup]) : [];
  const isCompatible = eligibleRecipientGroups.includes(r.bloodGroup);
  if (!isMatched && !isCompatible) throw httpError(403, 'This request was not sent to you');
  if (!isMatched) {
    r.matchedDonors.push(req.user._id);
  }
  if (r.responses.some((x) => x.donor.equals(req.user._id))) throw httpError(409, 'You have already responded to this request');
  if (r.status !== 'pending') throw httpError(400, `This request is already ${r.status}`);
  if (response === 'accepted' && !req.user.available) throw httpError(400, 'Set yourself as Available before accepting');

  r.responses.push({ donor: req.user._id, response });
  if (r.firstResponseMinutes == null) {
    r.firstResponseMinutes = Math.max(0.1, Math.round((Date.now() - r.createdAt.getTime()) / 6000) / 10);
  }
  if (response === 'accepted') {
    r.status = 'accepted';
    r.acceptedDonor = req.user._id;
    r.acceptedAt = new Date();
  }
  await r.save();

  await notify(r.requester, r._id, `${req.user.name} (${req.user.bloodGroup}) ${response} your request for ${r.patientName}.`, response === 'accepted' ? 'accepted' : 'declined');
  res.json({ message: response === 'accepted' ? 'Thank you! The requester has been notified.' : 'Response recorded.', request: serialize(await withRefs(BloodRequest.findById(r._id)), req.user) });
});

// POST /api/requests/:id/send/:donorId  (owner or admin) - send the request to one more donor
export const sendToDonor = wrap(async (req, res) => {
  const r = await BloodRequest.findById(req.params.id);
  if (!r) throw httpError(404, 'Request not found');
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !r.requester.equals(req.user._id)) throw httpError(403, 'You can only send your own requests');
  if (r.status !== 'pending') throw httpError(400, `Request is already ${r.status}`);
  const donor = await User.findOne({ _id: req.params.donorId, role: 'donor', isActive: true });
  if (!donor) throw httpError(404, 'Donor not found');
  const compatibleGroups = COMPATIBLE_DONORS_FOR_RECIPIENT[r.bloodGroup] || [r.bloodGroup];
  if (!compatibleGroups.includes(donor.bloodGroup)) throw httpError(400, `Donor blood group (${donor.bloodGroup}) is not compatible with this request (${r.bloodGroup})`);
  if (!donor.available) throw httpError(400, 'This donor is currently unavailable');
  if (r.matchedDonors.some((id) => id.equals(donor._id))) return res.json({ message: 'Request was already sent to this donor', alreadySent: true });

  r.matchedDonors.push(donor._id);
  await r.save();
  await notify(donor._id, r._id, `Blood needed: ${r.bloodGroup} at ${r.hospitalName}, ${r.city}.`, 'new_request');
  res.json({ message: `Request sent to ${donor.name}` });
});

// DELETE /api/requests/:id  (owner: only pending/cancelled, admin: any)
export const deleteRequest = wrap(async (req, res) => {
  const r = await BloodRequest.findById(req.params.id);
  if (!r) throw httpError(404, 'Request not found');
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !r.requester.equals(req.user._id)) throw httpError(403, 'You can only delete your own requests');
  if (!isAdmin && !['pending', 'cancelled'].includes(r.status)) throw httpError(400, 'Only pending or cancelled requests can be deleted. Cancel it first.');
  await Notification.deleteMany({ request: r._id });
  await r.deleteOne();
  res.json({ message: 'Request deleted' });
});
