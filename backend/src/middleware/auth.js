import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { wrap, httpError } from '../utils/helpers.js';

// Checks the "Authorization: Bearer <token>" header and loads the user
export const protect = wrap(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw httpError(401, 'Please log in to continue');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw httpError(401, 'User no longer exists');
  if (!user.isActive) throw httpError(403, 'Your account has been deactivated. Contact the administrator.');
  req.user = user;
  next();
});

// Role-based access control: authorize('admin'), authorize('donor','admin') ...
export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(httpError(403, 'You do not have permission to do this'));
  }
  next();
};
