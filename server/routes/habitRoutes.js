import express from 'express';
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
  getHabit,
} from '../controllers/habitController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getHabits).post(createHabit);
router.route('/:id').get(getHabit).put(updateHabit).delete(deleteHabit);
router.post('/:id/complete', completeHabit);

export default router;
