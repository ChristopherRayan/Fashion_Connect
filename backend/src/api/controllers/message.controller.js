import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { Message, Conversation } from '../../models/message.model.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';

// Get user conversations
export const getUserConversations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user._id;

  console.log('🔍 getUserConversations called for user:', userId);

  try {
    const conversations = await Conversation.findUserConversations(userId, { page: parseInt(page), limit: parseInt(limit) });
    console.log('📋 Raw conversations from DB:', conversations.length);

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      console.log('🔄 Processing conversation:', conv._id);
      console.log('👥 Participants:', conv.participants);

      // Handle case where participants might not be populated
      const otherParticipant = conv.participants.find(p => {
        const participantId = p._id || p;
        return participantId.toString() !== userId.toString();
      });

      console.log('👤 Other participant:', otherParticipant);

      if (!otherParticipant) {
        console.warn('⚠️ No other participant found for conversation:', conv._id);
        return null; // Skip this conversation
      }

      return {
        id: conv._id,
        participants: [{
          id: otherParticipant._id || otherParticipant,
          name: otherParticipant.name || 'Unknown User',
          email: otherParticipant.email || '',
          role: otherParticipant.role || 'USER',
          avatar: otherParticipant.profileImage
            ? `http://localhost:8000${otherParticipant.profileImage}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant.name || 'Unknown')}&background=6366f1&color=fff`,
          businessName: otherParticipant.businessName || null
        }],
        lastMessage: conv.lastMessage ? {
          id: conv.lastMessage._id,
          content: conv.lastMessage.content,
          timestamp: conv.lastMessage.createdAt,
          senderId: conv.lastMessage.sender?._id || conv.lastMessage.sender,
          senderName: conv.lastMessage.sender?.name || 'Unknown',
          read: conv.lastMessage.status === 'read'
        } : null,
        unreadCount: conv.unreadCount?.[userId.toString()] || 0,
        productContext: conv.productContext?.product ? {
          id: conv.productContext.product._id || conv.productContext.product,
          name: conv.productContext.productName || conv.productContext.product?.name,
          image: conv.productContext.productImage || (conv.productContext.product?.images && conv.productContext.product.images[0])
        } : null,
        lastActivity: conv.lastActivity
      };
    }).filter(conv => conv !== null); // Remove null conversations

    console.log('✅ Formatted conversations:', formattedConversations.length);

    return res.status(200).json(new ApiResponse(200, formattedConversations, "Conversations fetched successfully"));
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    console.error('❌ Error stack:', error.stack);
    throw new ApiError(500, "Failed to fetch conversations");
  }
});

// Get conversation messages
export const getConversationMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 30 } = req.query; // Reduced default limit for better performance
  const userId = req.user._id;

  // Verify user is part of the conversation
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  if (!conversation.participants.includes(userId)) {
    throw new ApiError(403, "Access denied to this conversation");
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get total count for pagination info
  const totalMessages = await Message.countDocuments({ conversation: conversationId });

  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'name email role profileImage businessName')
    .populate('receiver', 'name email role profileImage businessName')
    .populate('productReference.productId', 'name images price')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean(); // Use lean() for better performance

  // Format messages for frontend
  const formattedMessages = messages.reverse().map(msg => ({
    id: msg._id,
    content: msg.content,
    senderId: msg.sender._id.toString(), // Add explicit senderId field
    receiverId: msg.receiver._id.toString(), // Add explicit receiverId field
    sender: {
      id: msg.sender._id.toString(),
      name: msg.sender.name,
      avatar: msg.sender.profileImage
        ? `http://localhost:8000${msg.sender.profileImage}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.name)}&background=6366f1&color=fff`
    },
    receiver: {
      id: msg.receiver._id.toString(),
      name: msg.receiver.name,
      avatar: msg.receiver.profileImage
        ? `http://localhost:8000${msg.receiver.profileImage}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.receiver.name)}&background=6366f1&color=fff`
    },
    timestamp: msg.createdAt,
    read: msg.status === 'read',
    status: msg.status,
    attachments: (msg.attachments || []).map(att => ({
      type: att.type,
      url: `http://localhost:8000${att.url}`, // Construct full URL from stored relative path
      name: att.name,
      size: att.size
    })),
    productReference: msg.productReference ? {
      productId: msg.productReference.productId?._id || msg.productReference.productId,
      productName: msg.productReference.productName,
      productImage: msg.productReference.productImage,
      productPrice: msg.productReference.productPrice
    } : undefined
  }));

  // Mark messages as read for the current user
  await Message.updateMany(
    { 
      conversation: conversationId, 
      receiver: userId, 
      status: { $ne: 'read' } 
    },
    { 
      status: 'read', 
      readAt: new Date() 
    }
  );

  // Reset unread count for this user
  await conversation.resetUnreadCount(userId);

  // Prepare pagination info
  const totalPages = Math.ceil(totalMessages / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;

  const responseData = {
    messages: formattedMessages,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalMessages,
      hasNextPage,
      hasPrevPage,
      limit: parseInt(limit)
    }
  };

  return res.status(200).json(new ApiResponse(200, responseData, "Messages fetched successfully"));
});

// Send a message
export const sendMessage = asyncHandler(async (req, res) => {
  console.log('📨 sendMessage called with:', {
    body: req.body,
    files: req.files ? req.files.map(f => ({ name: f.originalname, size: f.size })) : 'none',
    user: req.user._id,
    hasFiles: !!(req.files && req.files.length > 0),
    filesLength: req.files ? req.files.length : 0,
    bodyKeys: Object.keys(req.body),
    contentType: req.headers['content-type']
  });

  const { receiverId, content, conversationId, productId, type, productImage } = req.body;
  const senderId = req.user._id;

  // Check if we have either content or attachments
  const hasAttachments = req.files && req.files.length > 0;

  if (!receiverId || (!content?.trim() && !hasAttachments)) {
    throw new ApiError(400, "Receiver ID and either message content or attachments are required");
  }

  // Verify receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new ApiError(404, "Receiver not found");
  }

  // Handle file attachments
  let attachments = [];
  if (req.files && req.files.length > 0) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    attachments = req.files.map(file => ({
      type: file.mimetype.startsWith('image/') ? 'image' : 'file',
      url: `/uploads/${file.filename}`, // Store relative path
      name: file.originalname,
      size: file.size
    }));

    console.log('📎 Processed attachments:', attachments);
  }

  let conversation;

  if (conversationId) {
    // Use existing conversation
    conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }
    
    // Verify user is part of the conversation
    if (!conversation.participants.includes(senderId)) {
      throw new ApiError(403, "Access denied to this conversation");
    }
  } else {
    // Find or create conversation
    conversation = await Conversation.findByParticipants(senderId, receiverId);
    
    if (!conversation) {
      // Create new conversation
      const conversationData = {
        participants: [senderId, receiverId],
        unreadCount: new Map()
      };

      // Add product context if provided
      if (productId) {
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

  // Add product reference if provided
  let productReference = null;
  if (productId) {
    const product = await Product.findById(productId);
    if (product) {
      const finalProductImage = productImage || product.images[0];
      console.log('🖼️ Product reference debug:', {
        productId: product._id,
        productName: product.name,
        providedProductImage: productImage,
        defaultProductImage: product.images[0],
        finalProductImage
      });
      
      productReference = {
        productId: product._id,
        productName: product.name,
        productImage: finalProductImage,
        productPrice: product.price
      };
    }
  }

  // Determine message type based on attachments
  let messageType = type || 'text';
  if (hasAttachments && !type) {
    // Auto-detect message type based on first attachment
    const firstAttachment = attachments[0];
    messageType = firstAttachment.type === 'image' ? 'image' : 'file';
  }

  // Create the message
  const message = new Message({
    conversation: conversation._id,
    sender: senderId,
    receiver: receiverId,
    content: content ? content.trim() : '',
    messageType: messageType,
    attachments: attachments,
    productReference: productReference,
    status: 'sent'
  });

  await message.save();

  // Update conversation
  conversation.lastMessage = message._id;
  conversation.lastActivity = new Date();
  
  // Increment unread count for receiver
  const currentUnreadCount = conversation.unreadCount.get(receiverId.toString()) || 0;
  conversation.unreadCount.set(receiverId.toString(), currentUnreadCount + 1);

  await conversation.save();

  // Populate message for response
  await message.populate('sender', 'name email role profileImage businessName isOnline lastSeen');
  await message.populate('receiver', 'name email role profileImage businessName isOnline lastSeen');

  const formattedMessage = {
    id: message._id,
    content: message.content,
    messageType: message.messageType,
    attachments: message.attachments.map(att => ({
      type: att.type,
      url: `http://localhost:8000${att.url}`, // Construct full URL from relative path
      name: att.name,
      size: att.size
    })),
    sender: {
      id: message.sender._id,
      name: message.sender.name,
      avatar: message.sender.profileImage
        ? `http://localhost:8000${message.sender.profileImage}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}&background=6366f1&color=fff`
    },
    receiver: {
      id: message.receiver._id,
      name: message.receiver.name,
      avatar: message.receiver.profileImage
        ? `http://localhost:8000${message.receiver.profileImage}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(message.receiver.name)}&background=6366f1&color=fff`
    },
    timestamp: message.createdAt,
    read: false,
    conversationId: conversation._id,
    productReference: message.productReference ? {
      productId: message.productReference.productId?._id || message.productReference.productId,
      productName: message.productReference.productName,
      productImage: message.productReference.productImage,
      productPrice: message.productReference.productPrice
    } : undefined
  };

  return res.status(201).json(new ApiResponse(201, formattedMessage, "Message sent successfully"));
});

// Start conversation with designer (from product page)
export const startConversationWithDesigner = asyncHandler(async (req, res) => {
  const { designerId, productId, initialMessage, productImage } = req.body;
  const userId = req.user._id;

  if (!designerId || !initialMessage?.trim()) {
    throw new ApiError(400, "Designer ID and initial message are required");
  }

  // Verify designer exists and has DESIGNER role
  const designer = await User.findOne({ _id: designerId, role: 'DESIGNER' });
  if (!designer) {
    throw new ApiError(404, "Designer not found");
  }

  // Send the message (this will create conversation if it doesn't exist)
  const messageData = {
    receiverId: designerId,
    content: initialMessage.trim(),
    productId,
    productImage
  };

  // Use the sendMessage function
  req.body = messageData;
  return sendMessage(req, res);
});

// Mark messages as read
export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  if (!conversation.participants.includes(userId)) {
    throw new ApiError(403, "Access denied to this conversation");
  }

  // Mark all unread messages as read
  await Message.updateMany(
    { 
      conversation: conversationId, 
      receiver: userId, 
      status: { $ne: 'read' } 
    },
    { 
      status: 'read', 
      readAt: new Date() 
    }
  );

  // Reset unread count
  conversation.unreadCount.set(userId.toString(), 0);
  await conversation.save();

  return res.status(200).json(new ApiResponse(200, null, "Messages marked as read"));
});
