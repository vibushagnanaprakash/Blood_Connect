import { Router } from 'express';
import { listNotifications, unreadCount, markRead, markAllRead } from '../controllers/notifications.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.get('/', listNotifications);
router.get('/unread-count', unreadCount);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
export default router;
