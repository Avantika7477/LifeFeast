import express from 'express';
import {
  getGlobalLeaderboard,
  getFriendsLeaderboard,
  addFriend,
} from '../controllers/leaderboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/global', getGlobalLeaderboard);
router.get('/friends', getFriendsLeaderboard);
router.post('/friends', addFriend);

export default router;
