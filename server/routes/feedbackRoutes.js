import express from 'express';
import {
  getPublicReviews,
  getMyFeedback,
  createFeedback,
  deleteMyFeedback,
} from '../controllers/feedbackController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', getPublicReviews);
router.get('/mine', getMyFeedback);
router.post('/', createFeedback);
router.delete('/:id', deleteMyFeedback);

export default router;
