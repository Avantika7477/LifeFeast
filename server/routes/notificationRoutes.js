import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  getVapidKey,
  savePushSubscription,
  removePushSubscription,
  runPushReminders,
  markRead,
  markAllRead,
  deleteNotification,
  generateDaily,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.get('/vapid-key', getVapidKey);
router.post('/push-reminders', runPushReminders);
router.use(protect);
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/generate-daily', generateDaily);
router.post('/subscribe', savePushSubscription);
router.delete('/subscribe', removePushSubscription);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

export default router;
