import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { Message, Conversation } from '../models/message.model.js';

// Store active connections
const activeConnections = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    console.log('🔐 Socket authentication attempt from:', socket.handshake.address);
    console.log('🔍 Socket handshake auth:', socket.handshake.auth);
    console.log('🔍 Socket handshake headers:', socket.handshake.headers);

    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.error('❌ No authentication token provided');
      return next(new Error('Authentication token required'));
    }

    console.log('🔑 Token received:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log('✅ Token decoded successfully:', { userId: decoded._id });

    const user = await User.findById(decoded._id).select('-password -refreshToken');

    if (!user) {
      console.error('❌ User not found for token');
      return next(new Error('Invalid token'));
    }

    console.log('✅ User authenticated:', { id: user._id, name: user.name });
    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    console.error('❌ Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

// Initialize Socket.IO
export const initializeSocket = (io) => {
  console.log('🚀 Initializing Socket.IO server...');

  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.user.name} connected successfully (${socket.userId})`);
    console.log(`📊 Total active connections: ${activeConnections.size + 1}`);

    // Store the connection
    activeConnections.set(socket.userId, socket);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);
    console.log(`🏠 User ${socket.userId} joined personal room`);

    // Join user to their conversation rooms
    joinUserConversations(socket);

    // Handle joining a conversation
    socket.on('join-conversation', async (conversationId) => {
      try {
        // Verify user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation && conversation.participants.includes(socket.userId)) {
          socket.join(`conversation:${conversationId}`);
          console.log(`📨 User ${socket.userId} joined conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    // Handle leaving a conversation
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`📤 User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle sending a message
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, receiverId, content, productId } = data;
        
        if (!receiverId || !content?.trim()) {
          socket.emit('message-error', { error: 'Receiver ID and content are required' });
          return;
        }

        // Verify receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit('message-error', { error: 'Receiver not found' });
          return;
        }

        let conversation;

        if (conversationId) {
          // Use existing conversation
          conversation = await Conversation.findById(conversationId);
          if (!conversation || !conversation.participants.includes(socket.userId)) {
            socket.emit('message-error', { error: 'Conversation not found or access denied' });
            return;
          }
        } else {
          // Find or create conversation
          conversation = await Conversation.findByParticipants(socket.userId, receiverId);
          
          if (!conversation) {
            // Create new conversation
            const conversationData = {
              participants: [socket.userId, receiverId],
              unreadCount: new Map()
            };

            // Add product context if provided
            if (productId) {
              const Product = (await import('../models/product.model.js')).Product;
              const product = await Product.findById(productId);
              if (product) {
                conversationData.productContext = {
                  product: productId,
                  productName: product.name,
                  productImage: product.images[0]
                };
              }
            }

            conversation = new Conversation(conversationData);
            await conversation.save();
          }
        }

        // Create the message
        const message = new Message({
          conversation: conversation._id,
          sender: socket.userId,
          receiver: receiverId,
          content: content.trim(),
          status: 'sent'
        });

        await message.save();

        // Populate message for response
        await message.populate([
          { path: 'sender', select: 'name email role profileImage businessName' },
          { path: 'receiver', select: 'name email role profileImage businessName' }
        ]);

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastActivity = new Date();
        
        // Update unread count for receiver
        const currentUnreadCount = conversation.unreadCount.get(receiverId) || 0;
        conversation.unreadCount.set(receiverId, currentUnreadCount + 1);
        
        await conversation.save();

        // Format message for frontend
        const formattedMessage = {
          id: message._id.toString(),
          content: message.content,
          sender: {
            id: message.sender._id.toString(),
            name: message.sender.name,
            avatar: message.sender.profileImage
              ? `http://localhost:8000${message.sender.profileImage}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}&background=6366f1&color=fff`
          },
          receiver: {
            id: message.receiver._id.toString(),
            name: message.receiver.name,
            avatar: message.receiver.profileImage
              ? `http://localhost:8000${message.receiver.profileImage}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(message.receiver.name)}&background=6366f1&color=fff`
          },
          timestamp: message.createdAt.toISOString(),
          read: false,
          conversationId: conversation._id.toString()
        };

        // Emit to conversation room
        io.to(`conversation:${conversation._id}`).emit('new-message', formattedMessage);
        
        // Emit to receiver's personal room for notifications
        io.to(`user:${receiverId}`).emit('message-notification', {
          conversationId: conversation._id.toString(),
          message: formattedMessage,
          unreadCount: conversation.unreadCount.get(receiverId)
        });

        // Confirm to sender
        socket.emit('message-sent', formattedMessage);

        console.log(`📨 Message sent from ${socket.userId} to ${receiverId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    socket.on('typing-stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', {
        userId: socket.userId
      });
    });

    // Handle marking messages as read
    socket.on('mark-messages-read', async (data) => {
      try {
        const { conversationId } = data;
        
        // Update message status
        await Message.updateMany(
          { 
            conversation: conversationId, 
            receiver: socket.userId,
            status: { $ne: 'read' }
          },
          { 
            status: 'read',
            readAt: new Date()
          }
        );

        // Update conversation unread count
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.unreadCount.set(socket.userId, 0);
          await conversation.save();
        }

        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit('messages-read', {
          userId: socket.userId,
          conversationId
        });

        console.log(`📖 Messages marked as read by ${socket.userId} in conversation ${conversationId}`);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle user status updates
    socket.on('update-status', (status) => {
      socket.broadcast.emit('user-status-update', {
        userId: socket.userId,
        status,
        lastSeen: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User ${socket.user.name} disconnected (${socket.userId})`);
      activeConnections.delete(socket.userId);
      
      // Broadcast user offline status
      socket.broadcast.emit('user-status-update', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date().toISOString()
      });
    });
  });
};

// Helper function to join user to their conversation rooms
const joinUserConversations = async (socket) => {
  try {
    const conversations = await Conversation.find({
      participants: socket.userId,
      isActive: true
    }).select('_id');

    conversations.forEach(conv => {
      socket.join(`conversation:${conv._id}`);
    });

    console.log(`📨 User ${socket.userId} joined ${conversations.length} conversation rooms`);
  } catch (error) {
    console.error('Error joining user conversations:', error);
  }
};

// Get online users
export const getOnlineUsers = () => {
  return Array.from(activeConnections.keys());
};

// Send notification to specific user
export const sendNotificationToUser = (userId, notification) => {
  const socket = activeConnections.get(userId);
  if (socket) {
    socket.emit('notification', notification);
    return true;
  }
  return false;
};
