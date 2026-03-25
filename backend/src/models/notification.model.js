import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const notificationSchema = new Schema({
  recipient: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sender: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  type: {
    type: String,
    enum: [
      'ORDER_CREATED',
      'ORDER_APPROVED',
      'ORDER_REJECTED',
      'ORDER_STATUS_UPDATED',
      'ORDER_DELIVERED',
      'CUSTOM_ORDER_REQUEST',
      'PAYMENT_RECEIVED',
      'INVOICE_GENERATED',
      'MESSAGE_RECEIVED',
      'PRODUCT_REVIEW',
      'SYSTEM_ANNOUNCEMENT',
      'COMPLAINT_RESPONSE',
      'COMPLAINT_ESCALATED',
      'COMPLAINT_RESOLVED'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    customData: Schema.Types.Mixed
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String
  },
  expiresAt: {
    type: Date
  }
}, { 
  timestamps: true 
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Add pagination plugin
notificationSchema.plugin(mongoosePaginate);

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static methods
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

notificationSchema.statics.createOrderNotification = function(order, type, customMessage = null) {
  const notificationData = {
    recipient: type === 'ORDER_CREATED' ? order.designer : order.user,
    sender: type === 'ORDER_CREATED' ? order.user : order.designer,
    type,
    data: { orderId: order._id }
  };

  switch (type) {
    case 'ORDER_CREATED':
      notificationData.title = 'New Order Received';
      notificationData.message = customMessage || `You have received a new order from ${order.user?.name || 'a customer'}`;
      notificationData.priority = 'HIGH';
      notificationData.actionRequired = true;
      notificationData.actionUrl = `/designer/orders/${order._id}`;
      break;
    case 'ORDER_APPROVED':
      notificationData.title = 'Order Approved';
      notificationData.message = customMessage || `Your order has been approved and is now being processed`;
      notificationData.priority = 'HIGH';
      notificationData.actionUrl = `/client/orders/${order._id}`;
      break;
    case 'ORDER_REJECTED':
      notificationData.title = 'Order Update';
      notificationData.message = customMessage || `Your order requires attention from the designer`;
      notificationData.priority = 'HIGH';
      notificationData.actionUrl = `/client/orders/${order._id}`;
      break;
    case 'ORDER_STATUS_UPDATED':
      notificationData.title = 'Order Status Updated';
      notificationData.message = customMessage || `Your order status has been updated to ${order.status}`;
      notificationData.priority = 'MEDIUM';
      notificationData.actionUrl = `/client/orders/${order._id}`;
      break;
    default:
      notificationData.title = 'Order Update';
      notificationData.message = customMessage || 'Your order has been updated';
  }

  return this.create(notificationData);
};

export const Notification = mongoose.model('Notification', notificationSchema);
