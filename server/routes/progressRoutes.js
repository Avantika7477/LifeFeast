import express from 'express';
import {
  getDashboard,
  getCalendar,
  getDayDetail,
  getAnalytics,
} from '../controllers/progressController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/dashboard', getDashboard);
router.get('/calendar', getCalendar);
router.get('/calendar/:date', getDayDetail);
router.get('/analytics', getAnalytics);

export default router;
