import { Router } from 'express';
import { createRequest, listRequests, getRequest, updateStatus, respondToRequest, sendToDonor, deleteRequest } from '../controllers/requests.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.post('/', authorize('requester', 'hospital', 'admin'), createRequest);
router.get('/', listRequests);
router.get('/:id', getRequest);
router.put('/:id/status', authorize('requester', 'hospital', 'admin'), updateStatus);
router.post('/:id/respond', authorize('donor'), respondToRequest);
router.post('/:id/send/:donorId', authorize('requester', 'hospital', 'admin'), sendToDonor);
router.delete('/:id', authorize('requester', 'hospital', 'admin'), deleteRequest);
export default router;
