import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { notificationService } from '../../services/notificationService.js';

// Get user notifications
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, unreadOnly = false, type } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    unreadOnly: unreadOnly === 'true',
    type: type || null
  };

  const notifications = await notificationService.getUserNotifications(userId, options);

  return res.status(200).json(
    new ApiResponse(200, notifications, "Notifications fetched successfully")
  );
});

// Get unread notification count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const count = await notificationService.getUnreadCount(userId);

  return res.status(200).json(
    new ApiResponse(200, { count }, "Unread count fetched successfully")
  );
});

// Mark notification as read
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await notificationService.markAsRead(notificationId, userId);

  return res.status(200).json(
    new ApiResponse(200, notification, "Notification marked as read")
  );
});

// Mark all notifications as read
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await notificationService.markAllAsRead(userId);

  return res.status(200).json(
    new ApiResponse(200, result, "All notifications marked as read")
  );
});

// Create a notification (admin only)
export const createNotification = asyncHandler(async (req, res) => {
  const { recipient, type, title, message, data, priority, actionRequired, actionUrl } = req.body;
  const senderId = req.user._id;

  if (!recipient || !type || !title || !message) {
    throw new ApiError(400, "Recipient, type, title, and message are required");
  }

  const notificationData = {
    recipient,
    sender: senderId,
    type,
    title,
    message,
    data: data || {},
    priority: priority || 'MEDIUM',
    actionRequired: actionRequired || false,
    actionUrl: actionUrl || null
  };

  const notification = await notificationService.createNotification(notificationData);

  return res.status(201).json(
    new ApiResponse(201, notification, "Notification created successfully")
  );
});

// Delete notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: userId
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  await notification.deleteOne();

  return res.status(200).json(
    new ApiResponse(200, null, "Notification deleted successfully")
  );
});

// Get notification statistics (admin only)
export const getNotificationStats = asyncHandler(async (req, res) => {
  const { timeframe = '7d' } = req.query;
  
  let startDate = new Date();
  switch (timeframe) {
    case '24h':
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  const stats = await Notification.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        unreadCount: {
          $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const totalNotifications = await Notification.countDocuments({
    createdAt: { $gte: startDate }
  });

  const totalUnread = await Notification.countDocuments({
    createdAt: { $gte: startDate },
    read: false
  });

  return res.status(200).json(
    new ApiResponse(200, {
      stats,
      summary: {
        total: totalNotifications,
        unread: totalUnread,
        readRate: totalNotifications > 0 ? ((totalNotifications - totalUnread) / totalNotifications * 100).toFixed(2) : 0
      }
    }, "Notification statistics fetched successfully")
  );
});
