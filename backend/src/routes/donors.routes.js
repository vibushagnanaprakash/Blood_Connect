import { Router } from 'express';
import { searchDonors, getDonor, updateDonor, deleteDonor } from '../controllers/donors.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.get('/', searchDonors);
router.get('/search', searchDonors);
router.get('/:id', protect, getDonor);
router.put('/:id', protect, updateDonor);
router.delete('/:id', protect, deleteDonor);
export default router;
