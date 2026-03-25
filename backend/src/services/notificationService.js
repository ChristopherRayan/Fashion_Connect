import { Notification } from '../models/notification.model.js';
import { sendNotificationToUser } from './socketService.js';
import emailService from './emailService.js';

class NotificationService {
  // Create a notification
  async createNotification(notificationData) {
    try {
      const notification = await Notification.create(notificationData);
      
      // Populate sender and recipient for real-time notification
      await notification.populate([
        { path: 'sender', select: 'name email role profileImage' },
        { path: 'recipient', select: 'name email role' }
      ]);

      // Send real-time notification via socket
      const realTimeNotification = {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        actionRequired: notification.actionRequired,
        actionUrl: notification.actionUrl,
        sender: notification.sender,
        createdAt: notification.createdAt
      };

      // Send to user via socket if they're online
      const sent = sendNotificationToUser(notification.recipient._id.toString(), realTimeNotification);
      
      console.log(`📢 Notification created for user ${notification.recipient._id}:`, notification.title);
      if (sent) {
        console.log(`✅ Real-time notification sent to user ${notification.recipient._id}`);
      } else {
        console.log(`📱 User ${notification.recipient._id} is offline, notification stored for later`);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create order-related notifications
  async createOrderNotification(order, type, customMessage = null) {
    try {
      // Populate order with user and designer info
      await order.populate([
        { path: 'user', select: 'name email role' },
        { path: 'designer', select: 'name email role businessName' }
      ]);

      const notification = await Notification.createOrderNotification(order, type, customMessage);
      
      // Send real-time notification
      await this.createNotification({
        recipient: notification.recipient,
        sender: notification.sender,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        actionRequired: notification.actionRequired,
        actionUrl: notification.actionUrl
      });

      return notification;
    } catch (error) {
      console.error('Error creating order notification:', error);
      throw error;
    }
  }

  // Notify designer about new order
  async notifyDesignerNewOrder(order) {
    await order.populate([
      { path: 'buyer', select: 'name email' },
      { path: 'designer', select: 'name email businessName' }
    ]);

    const message = order.isCustomOrder
      ? `You have received a new custom order request from ${order.buyer.name}. Please review the requirements and respond accordingly. Invoice will be generated upon approval.`
      : `You have received a new order (#${order._id.toString().slice(-6)}) from ${order.buyer.name} for MWK ${order.totalAmount.toLocaleString()}. Invoice has been generated and is available for download.`;

    return await this.createNotification({
      recipient: order.designer._id,
      sender: order.buyer._id,
      type: 'ORDER_CREATED',
      title: order.isCustomOrder ? 'New Custom Order Request' : 'New Order Received',
      message,
      data: { orderId: order._id },
      priority: 'HIGH',
      actionRequired: true,
      actionUrl: `/designer/orders/${order._id}`
    });
  }

  // Notify admin about new order
  async notifyAdminNewOrder(order, adminUsers) {
    await order.populate([
      { path: 'buyer', select: 'name email' },
      { path: 'designer', select: 'name email businessName' }
    ]);

    const message = `New order (#${order._id.toString().slice(-6)}) placed by ${order.buyer.name} with ${order.designer.businessName || order.designer.name} for MWK ${order.totalAmount.toLocaleString()}.`;

    const notifications = [];
    for (const admin of adminUsers) {
      const notification = await this.createNotification({
        recipient: admin._id,
        sender: order.buyer._id,
        type: 'ORDER_CREATED',
        title: 'New Order in System',
        message,
        data: { orderId: order._id },
        priority: 'MEDIUM',
        actionRequired: false,
        actionUrl: `/admin/orders/${order._id}`
      });
      notifications.push(notification);
    }

    return notifications;
  }

  // Notify customer about order status change
  async notifyCustomerOrderUpdate(order, status, customMessage = null) {
    await order.populate([
      { path: 'buyer', select: 'name email' },
      { path: 'designer', select: 'name email businessName' }
    ]);

    let title, message, priority;
    
    switch (status) {
      case 'CONFIRMED':
        title = 'Order Confirmed';
        message = customMessage || `Your order has been confirmed by ${order.designer.businessName || order.designer.name} and is now being processed.`;
        priority = 'HIGH';
        break;
      case 'PROCESSING':
        title = 'Order in Production';
        message = customMessage || `Your order is now in production. We'll keep you updated on the progress.`;
        priority = 'MEDIUM';
        break;
      case 'READY_FOR_SHIPPING':
        title = 'Order Ready for Shipping';
        message = customMessage || `Great news! Your order is ready and will be shipped soon.`;
        priority = 'HIGH';
        break;
      case 'SHIPPED':
        title = 'Order Shipped';
        message = customMessage || `Your order has been shipped and is on its way to you.`;
        priority = 'HIGH';
        break;
      case 'DELIVERED':
        title = 'Order Delivered';
        message = customMessage || `Your order has been delivered. We hope you love it!`;
        priority = 'MEDIUM';
        break;
      case 'CANCELLED':
        title = 'Order Cancelled';
        message = customMessage || `Your order has been cancelled. If you have any questions, please contact the designer.`;
        priority = 'HIGH';
        break;
      default:
        title = 'Order Updated';
        message = customMessage || `Your order status has been updated to ${status}.`;
        priority = 'MEDIUM';
    }

    return await this.createNotification({
      recipient: order.buyer._id,
      sender: order.designer._id,
      type: 'ORDER_STATUS_UPDATED',
      title,
      message,
      data: { orderId: order._id },
      priority,
      actionRequired: false,
      actionUrl: `/client/orders/${order._id}`
    });
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null
    } = options;

    const query = { recipient: userId };
    if (unreadOnly) query.read = false;
    if (type) query.type = type;

    const paginateOptions = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'sender', select: 'name email role profileImage businessName' }
      ]
    };

    return await Notification.paginate(query, paginateOptions);
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return await notification.markAsRead();
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    return await Notification.markAllAsRead(userId);
  }

  // Get unread count
  async getUnreadCount(userId) {
    return await Notification.getUnreadCount(userId);
  }

  // Clean up old notifications (optional - can be run as a cron job)
  async cleanupOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true
    });
  }

  // Custom Order Notifications
  async notifyDesignerNewCustomOrder(customOrder) {
    try {
      const notification = await this.createNotification({
        recipient: customOrder.designer._id,
        sender: customOrder.user._id,
        type: 'custom_order',
        title: 'New Custom Order Request',
        message: `${customOrder.user.name} has requested a custom ${customOrder.productType}`,
        data: {
          customOrderId: customOrder._id,
          productType: customOrder.productType,
          estimatedPrice: customOrder.estimatedPrice,
          expectedDeliveryDate: customOrder.expectedDeliveryDate
        },
        priority: 'high',
        actionRequired: true,
        actionUrl: `/designer/custom-orders/${customOrder._id}`
      });

      console.log('✅ Designer notification sent for new custom order:', customOrder._id);
      return notification;
    } catch (error) {
      console.error('❌ Error sending designer custom order notification:', error);
      throw error;
    }
  }

  async notifyCustomerCustomOrderUpdate(customOrder, oldStatus) {
    try {
      let title, message;

      switch (customOrder.status) {
        case 'accepted':
          title = 'Custom Order Accepted';
          message = `Your custom order for ${customOrder.productType} has been accepted by ${customOrder.designer.name}`;
          break;
        case 'in_progress':
          title = 'Custom Order In Progress';
          message = `Work has started on your custom ${customOrder.productType}`;
          break;
        case 'completed':
          title = 'Custom Order Completed';
          message = `Your custom ${customOrder.productType} is ready!`;
          break;
        case 'rejected':
          title = 'Custom Order Declined';
          message = `Your custom order for ${customOrder.productType} has been declined`;
          break;
        default:
          title = 'Custom Order Updated';
          message = `Your custom order status has been updated to ${customOrder.status}`;
      }

      const notification = await this.createNotification({
        recipient: customOrder.user._id,
        sender: customOrder.designer._id,
        type: 'custom_order_update',
        title,
        message,
        data: {
          customOrderId: customOrder._id,
          status: customOrder.status,
          oldStatus,
          productType: customOrder.productType,
          estimatedPrice: customOrder.estimatedPrice
        },
        priority: customOrder.status === 'completed' ? 'high' : 'medium',
        actionRequired: customOrder.status === 'completed',
        actionUrl: `/client/custom-orders/${customOrder._id}`
      });

      console.log('✅ Customer notification sent for custom order update:', customOrder._id);
      return notification;
    } catch (error) {
      console.error('❌ Error sending customer custom order update notification:', error);
      throw error;
    }
  }

  async notifyDesignerCustomOrderCancelled(customOrder) {
    try {
      const notification = await this.createNotification({
        recipient: customOrder.designer._id,
        sender: customOrder.user._id,
        type: 'custom_order_cancelled',
        title: 'Custom Order Cancelled',
        message: `${customOrder.user.name} has cancelled their custom order for ${customOrder.productType}`,
        data: {
          customOrderId: customOrder._id,
          productType: customOrder.productType,
          cancellationReason: customOrder.cancellationReason
        },
        priority: 'medium',
        actionRequired: false,
        actionUrl: `/designer/custom-orders/${customOrder._id}`
      });

      console.log('✅ Designer notification sent for custom order cancellation:', customOrder._id);
      return notification;
    } catch (error) {
      console.error('❌ Error sending designer custom order cancellation notification:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
