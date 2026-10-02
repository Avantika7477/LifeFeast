import express from 'express';
import {
  getJournals,
  getJournalByDate,
  upsertJournal,
  deleteJournal,
} from '../controllers/journalController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', getJournals);
router.get('/:date', getJournalByDate);
router.post('/', upsertJournal);
router.delete('/:id', deleteJournal);

export default router;
