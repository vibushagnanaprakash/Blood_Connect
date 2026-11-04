import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me, updateMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
});

const router = Router();
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, me);
router.put('/me', protect, updateMe);
export default router;
