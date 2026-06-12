import express from 'express';
import { register, login, verifyLogin2FA, setup2FA, enable2FA, disable2FA, getSessions, logout } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/login/2fa', verifyLogin2FA);

// Protected routes
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);
router.get('/sessions', protect, getSessions);
router.post('/logout', protect, logout);

export default router;
