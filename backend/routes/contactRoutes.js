import express from 'express';
import {
  submitContactMessage,
  getMyContactMessages,
  getAllContactMessages,
  updateMessageStatus,
  replyToMessage,
  deleteContactMessage,
  getContactStats
} from '../controllers/contactController.js';
import { protect, adminOnly } from '../middleware/authmiddleware.js';

const router = express.Router();

// User routes (Protected - must be logged in)
router.post('/', protect, submitContactMessage);
router.get('/my-messages', protect, getMyContactMessages);

// Admin routes
router.get('/all', protect, adminOnly, getAllContactMessages);
router.get('/stats', protect, adminOnly, getContactStats);
router.patch('/:userId/:messageId/status', protect, adminOnly, updateMessageStatus);
router.post('/:userId/:messageId/reply', protect, adminOnly, replyToMessage);
router.delete('/:userId/:messageId', protect, adminOnly, deleteContactMessage);

export default router;