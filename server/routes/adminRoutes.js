import express from 'express';
import {
  getUsers,
  deleteUser,
  toggleUserActive,
  getAdminAnalytics,
  getBadges,
  getReports,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, admin);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/toggle', toggleUserActive);
router.get('/analytics', getAdminAnalytics);
router.get('/badges', getBadges);
router.get('/reports', getReports);

export default router;
