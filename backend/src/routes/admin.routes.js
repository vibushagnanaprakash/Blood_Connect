import { Router } from 'express';
import { dashboard, listUsers, setUserActive, deleteUser } from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/dashboard', dashboard);
router.get('/analytics', dashboard);
router.get('/users', listUsers);
router.patch('/users/:id/active', setUserActive);
router.delete('/users/:id', deleteUser);
export default router;
