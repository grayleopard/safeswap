import express from 'express';
import { sendVerificationCode, verifyCode, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/send-code', sendVerificationCode);
router.post('/verify', verifyCode);
router.get('/me', authenticateToken, getMe);

export default router;
