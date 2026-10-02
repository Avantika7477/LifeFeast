import express from 'express';
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  generateDaily,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', getNotifications);
router.post('/generate-daily', generateDaily);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

export default router;
