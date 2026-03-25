import { Router } from 'express';
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  deleteNotification,
  getNotificationStats
} from '../controllers/notification.controller.js';
import { verifyJWT, authorizeRoles } from '../../middlewares/auth.middleware.js';

const router = Router();

// All notification routes require authentication
router.use(verifyJWT);

// Get user notifications
router.route('/').get(getUserNotifications);

// Get unread notification count
router.route('/unread-count').get(getUnreadCount);

// Mark all notifications as read
router.route('/mark-all-read').patch(markAllNotificationsAsRead);

// Mark specific notification as read
router.route('/:notificationId/read').patch(markNotificationAsRead);

// Delete notification
router.route('/:notificationId').delete(deleteNotification);

// Admin only routes
router.route('/create').post(authorizeRoles('ADMIN'), createNotification);
router.route('/stats').get(authorizeRoles('ADMIN'), getNotificationStats);

export default router;
