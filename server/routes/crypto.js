import express from 'express';
import { auditCryptoOperation } from '../controllers/cryptoController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/audit', protect, auditCryptoOperation);

export default router;
