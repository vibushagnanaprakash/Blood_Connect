import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { wrap, httpError, cleanCoords } from '../utils/helpers.js';
import { applyProfileUpdates } from '../utils/profile.js';

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register  (public) - admin accounts can NOT be created here
export const register = wrap(async (req, res) => {
  const { name, email, password, phone, role = 'requester', bloodGroup, city, area, hospitalName, coordinates } = req.body;
  if (!['donor', 'requester', 'hospital'].includes(role)) throw httpError(400, 'Invalid role');
  if (!password || String(password).length < 6) throw httpError(400, 'Password must be at least 6 characters');
  if (role === 'hospital' && !hospitalName) throw httpError(400, 'Hospital name is required');

  const user = await User.create({
    name, email, password, phone, role, city, area,
    bloodGroup: role === 'donor' ? bloodGroup : undefined,
    hospitalName: role === 'hospital' ? hospitalName : undefined,
    coordinates: cleanCoords(coordinates) || undefined,
  });
  res.status(201).json({ token: signToken(user._id), user });
});

// POST /api/auth/login (public)
export const login = wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required');
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw httpError(401, 'Invalid email or password');
  if (!user.isActive) throw httpError(403, 'Your account has been deactivated. Contact the administrator.');
  res.json({ token: signToken(user._id), user });
});

// GET /api/auth/me
export const me = wrap(async (req, res) => res.json({ user: req.user }));

// PUT /api/auth/me  - update own profile / availability
export const updateMe = wrap(async (req, res) => {
  applyProfileUpdates(req.user, req.body);
  await req.user.save({ validateModifiedOnly: true });
  res.json({ user: req.user });
});
