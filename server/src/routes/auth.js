import express from 'express';
import { sendVerificationCode, verifyCode, completeProfile, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/send-code', sendVerificationCode);
router.post('/verify', verifyCode);
router.post('/complete-profile', completeProfile);
router.get('/me', authenticateToken, getMe);

export default router;
