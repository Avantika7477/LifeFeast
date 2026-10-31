import express from 'express';
import {
  listFriends,
  listRequests,
  searchPeople,
  requestFriend,
  respondFriend,
  getMessages,
  sendMessage,
  listChallenges,
  sendChallenge,
  respondChallenge,
  completeChallenge,
} from '../controllers/socialController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/friends', listFriends);
router.get('/people', searchPeople);
router.get('/requests', listRequests);
router.post('/requests', requestFriend);
router.post('/requests/:id/respond', respondFriend);
router.get('/messages/:friendId', getMessages);
router.post('/messages/:friendId', sendMessage);
router.get('/challenges', listChallenges);
router.post('/challenges', sendChallenge);
router.post('/challenges/:id/respond', respondChallenge);
router.post('/challenges/:id/complete', completeChallenge);

export default router;
