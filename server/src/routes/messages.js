import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/conversations', authenticateToken, getConversations);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.get('/:otherUserId', authenticateToken, getMessages);
router.post('/', authenticateToken, sendMessage);
router.put('/:messageId/read', authenticateToken, markAsRead);

export default router;
