import express from 'express';
import { portScan, analyzeHeaders, ipWhois } from '../controllers/scannerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/port-scan', protect, portScan);
router.post('/headers', protect, analyzeHeaders);
router.post('/whois', protect, ipWhois);

export default router;
