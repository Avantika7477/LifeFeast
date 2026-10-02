import express from 'express';
import { getMissions, completeMission } from '../controllers/missionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', getMissions);
router.post('/:id/complete', completeMission);

export default router;
