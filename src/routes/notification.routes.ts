import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
  sendTestEmail,
} from '../controllers/notification.controller';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Notification routes
router.get('/', getNotifications);
router.patch('/:notificationId/mark-read', markAsRead);
router.post('/mark-all-read', markAllAsRead);

// Preferences routes
router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);

// Test route
router.post('/test-email', sendTestEmail);

export default router;
