import mongoose, { Schema } from 'mongoose';

// Message Schema
const messageSchema = new Schema({
  conversation: { 
    type: Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true 
  },
  sender: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiver: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: function() {
      // Content is required only if there are no attachments
      return !this.attachments || this.attachments.length === 0;
    },
    trim: true,
    default: ''
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    size: {
      type: Number
    }
  }],
  productReference: {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    productImage: String,
    productPrice: Number
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ status: 1 });
// Compound index for efficient message queries with status filtering
messageSchema.index({ conversation: 1, receiver: 1, status: 1 });
// Index for efficient message counting and pagination
messageSchema.index({ conversation: 1, createdAt: 1 });

// Conversation Schema
const conversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // Product context for conversations that start from a product inquiry
  productContext: {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    productImage: String
  },
  // Conversation metadata for custom orders and assignments
  metadata: {
    type: {
      type: String,
      enum: ['custom_order', 'tailor_assignment', 'general']
    },
    customOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'CustomOrder'
    },
    originalConversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    originalCustomerId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Conversation metadata
  isActive: {
    type: Boolean,
    default: true
  },
  // Unread count for each participant
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Indexes for better query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ 'productContext.product': 1 });
// Compound index for efficient user conversation queries
conversationSchema.index({ participants: 1, lastActivity: -1 });
// Index for active conversations
conversationSchema.index({ isActive: 1, lastActivity: -1 });

// Methods for Conversation
conversationSchema.methods.getUnreadCount = function(userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

conversationSchema.methods.setUnreadCount = function(userId, count) {
  this.unreadCount.set(userId.toString(), count);
  return this.save();
};

conversationSchema.methods.incrementUnreadCount = function(userId) {
  const currentCount = this.getUnreadCount(userId);
  return this.setUnreadCount(userId, currentCount + 1);
};

conversationSchema.methods.resetUnreadCount = function(userId) {
  return this.setUnreadCount(userId, 0);
};

// Static methods for Conversation
conversationSchema.statics.findByParticipants = function(participant1, participant2) {
  return this.findOne({
    participants: {
      $all: [participant1, participant2],
      $size: 2
    },
    isActive: true
  });
};

conversationSchema.statics.findUserConversations = function(userId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find({
    participants: userId,
    isActive: true
  })
    .populate('participants', 'name email role profileImage businessName isOnline lastSeen')
    .populate({
      path: 'lastMessage',
      select: 'content createdAt sender status',
      populate: {
        path: 'sender',
        select: 'name'
      }
    })
    .populate('productContext.product', 'name images')
    .sort({ lastActivity: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // Use lean() for better performance when we don't need full Mongoose documents
};

// This duplicate method has been removed - using the one above

// Get conversation messages with pagination
conversationSchema.methods.getMessages = function(options = {}) {
  const { page = 1, limit = 30 } = options;
  const skip = (page - 1) * limit;

  return Message.find({ conversation: this._id })
    .populate('sender', 'name email role profileImage businessName isOnline lastSeen')
    .populate('receiver', 'name email role profileImage businessName isOnline lastSeen')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Mark conversation messages as read for a user
conversationSchema.methods.markAsReadForUser = function(userId) {
  return Message.updateMany(
    {
      conversation: this._id,
      receiver: userId,
      status: { $ne: 'read' }
    },
    {
      status: 'read',
      readAt: new Date()
    }
  );
};

// Get unread count for a user
conversationSchema.methods.getUnreadCountForUser = function(userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

// Update last activity
conversationSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Pre-save middleware to update lastActivity
conversationSchema.pre('save', function(next) {
  if (this.isModified('lastMessage')) {
    this.lastActivity = new Date();
  }
  next();
});

export const Message = mongoose.model('Message', messageSchema);
export const Conversation = mongoose.model('Conversation', conversationSchema);
