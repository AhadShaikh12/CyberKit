import express from 'express';
import { getAuditLogs, clearAuditLogs } from '../controllers/logsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAuditLogs);
router.delete('/clear', protect, clearAuditLogs);

export default router;
