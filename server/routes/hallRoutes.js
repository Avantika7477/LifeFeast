import express from 'express';
import { buyCompanion, equipCompanion, getHall, getShop, reactWin, shareWin } from '../controllers/hallController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', getHall);
router.post('/', shareWin);
router.get('/shop', getShop);
router.post('/shop/buy', buyCompanion);
router.post('/shop/equip', equipCompanion);
router.post('/:id/react', reactWin);

export default router;
