import { Message, Conversation } from '../models/message.model.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';

class MessageService {
  /**
   * Start a conversation with a designer and send initial message
   * @param {string} userId - ID of the user starting the conversation
   * @param {string} designerId - ID of the designer
   * @param {string} messageContent - Initial message content
   * @param {string} productId - Optional product ID to attach
   * @param {string} productImage - Optional product image URL
   * @returns {Promise<Object>} Created conversation
   */
  async startConversationWithDesigner(userId, designerId, messageContent, productId = null, productImage = null) {
    try {
      console.log('🚀 Starting conversation between user:', userId, 'and designer:', designerId);

      // Verify designer exists and has DESIGNER role
      const designer = await User.findOne({ _id: designerId, role: 'DESIGNER' });
      if (!designer) {
        throw new ApiError(404, 'Designer not found');
      }

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Check if conversation already exists between these users
      let conversation = await Conversation.findOne({
        participants: { $all: [userId, designerId] }
      }).populate('participants', 'name email role businessName profileImage');

      // If no conversation exists, create one
      if (!conversation) {
        console.log('📝 Creating new conversation');
        conversation = await Conversation.create({
          participants: [userId, designerId],
          lastMessage: null,
          unreadCount: new Map([
            [userId.toString(), 0],
            [designerId.toString(), 0]
          ])
        });

        // Populate the participants
        conversation = await Conversation.findById(conversation._id)
          .populate('participants', 'name email role businessName profileImage');
      }

      // Prepare message data
      const messageData = {
        conversation: conversation._id,
        sender: userId,
        receiver: designerId,
        content: messageContent,
        status: 'sent'
      };

      // Add product reference if provided
      if (productId) {
        const product = await Product.findById(productId);
        if (product) {
          messageData.productReference = {
            productId: productId,
            productName: product.name,
            productImage: productImage || product.images[0] || null,
            productPrice: product.price
          };
        }
      }

      // Create the message
      const message = await Message.create(messageData);

      // Update conversation with last message
      conversation.lastMessage = message._id;
      conversation.updatedAt = new Date();
      
      // Increment unread count for designer
      const currentUnreadCount = conversation.unreadCount.get(designerId.toString()) || 0;
      conversation.unreadCount.set(designerId.toString(), currentUnreadCount + 1);
      
      await conversation.save();

      // Populate the message for response
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name email role businessName profileImage')
        .populate('receiver', 'name email role businessName profileImage')
        .populate('productReference.productId', 'name images price');

      console.log('✅ Conversation started successfully:', conversation._id);
      console.log('📨 Initial message sent:', message._id);

      return {
        conversation,
        message: populatedMessage
      };

    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      throw error;
    }
  }

  /**
   * Send a message in an existing conversation
   * @param {string} conversationId - ID of the conversation
   * @param {string} senderId - ID of the sender
   * @param {string} content - Message content
   * @param {Array} attachments - Optional file attachments
   * @returns {Promise<Object>} Created message
   */
  async sendMessage(conversationId, senderId, content, attachments = []) {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
      }

      if (!conversation.participants.includes(senderId)) {
        throw new ApiError(403, 'Access denied to this conversation');
      }

      // Get receiver ID
      const receiverId = conversation.participants.find(p => p.toString() !== senderId.toString());

      const messageData = {
        conversation: conversationId,
        sender: senderId,
        receiver: receiverId,
        content: content.trim(),
        status: 'sent'
      };

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        messageData.attachments = attachments.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`
        }));
      }

      const message = await Message.create(messageData);

      // Update conversation
      conversation.lastMessage = message._id;
      conversation.updatedAt = new Date();
      
      // Increment unread count for receiver
      const currentUnreadCount = conversation.unreadCount.get(receiverId.toString()) || 0;
      conversation.unreadCount.set(receiverId.toString(), currentUnreadCount + 1);
      
      await conversation.save();

      // Populate the message for response
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name email role businessName profileImage')
        .populate('receiver', 'name email role businessName profileImage')
        .populate('productReference.productId', 'name images price');

      return populatedMessage;

    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   * @param {string} conversationId - ID of the conversation
   * @param {string} userId - ID of the requesting user
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} Messages
   */
  async getConversationMessages(conversationId, userId, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new ApiError(404, 'Conversation not found');
      }

      if (!conversation.participants.includes(userId)) {
        throw new ApiError(403, 'Access denied to this conversation');
      }

      const messages = await Message.find({ conversation: conversationId })
        .populate('sender', 'name email role businessName profileImage')
        .populate('receiver', 'name email role businessName profileImage')
        .populate('productReference.productId', 'name images price')
        .sort({ createdAt: -1 })
        .limit(limit * page)
        .skip((page - 1) * limit);

      return messages.reverse(); // Return in chronological order

    } catch (error) {
      console.error('❌ Error getting conversation messages:', error);
      throw error;
    }
  }

  /**
   * Forward messages to tailor when order is assigned
   * @param {string} orderId - ID of the custom order
   * @param {string} tailorId - ID of the tailor
   * @param {string} designerId - ID of the designer
   * @returns {Promise<Object>} Created conversation
   */
  async forwardMessagesToTailor(orderId, tailorId, designerId) {
    try {
      console.log('🔄 Forwarding messages to tailor for order:', orderId);

      // Get the custom order details
      const { CustomOrder } = await import('../models/customOrder.model.js');
      const order = await CustomOrder.findById(orderId).populate('user', 'name email');

      if (!order) {
        console.log('Order not found:', orderId);
        return null;
      }

      // Create or find conversation between designer and tailor
      let tailorConversation = await Conversation.findOne({
        participants: { $all: [designerId, tailorId] },
        'metadata.type': 'tailor_assignment',
        'metadata.customOrderId': orderId
      });

      if (!tailorConversation) {
        tailorConversation = await Conversation.create({
          participants: [designerId, tailorId],
          lastMessage: null,
          unreadCount: new Map([
            [designerId.toString(), 0],
            [tailorId.toString(), 0]
          ]),
          metadata: {
            type: 'tailor_assignment',
            customOrderId: orderId,
            originalCustomerId: order.user._id
          }
        });
      }

      // Create order assignment message for the tailor
      const assignmentContent = `📋 **ORDER ASSIGNMENT**\n\n` +
        `You have been assigned a new custom order!\n\n` +
        `**Order Details:**\n` +
        `• Order ID: #${orderId.toString().slice(-6)}\n` +
        `• Product: ${order.productType}\n` +
        `• Customer: ${order.user.name}\n` +
        `• Budget: MWK ${order.estimatedPrice.toLocaleString()}\n` +
        `• Due Date: ${new Date(order.expectedDeliveryDate).toLocaleDateString()}\n\n` +
        `${order.additionalNotes ? `**Customer Notes:** ${order.additionalNotes}\n\n` : ''}` +
        `Please review the order details and begin work. Contact the designer if you need any clarification.`;

      // Send assignment message to tailor conversation
      const assignmentMessage = await Message.create({
        sender: designerId,
        receiver: tailorId,
        conversation: tailorConversation._id,
        content: assignmentContent,
        messageType: 'text',
        status: 'sent'
      });

      // Update conversation's last message
      tailorConversation.lastMessage = assignmentMessage._id;
      tailorConversation.lastActivity = new Date();
      tailorConversation.unreadCount.set(tailorId.toString(),
        (tailorConversation.unreadCount.get(tailorId.toString()) || 0) + 1
      );
      await tailorConversation.save();

      console.log('✅ Order assignment message sent to tailor successfully');
      return tailorConversation;

    } catch (error) {
      console.error('❌ Error forwarding messages to tailor:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const messageService = new MessageService();
export default messageService;
