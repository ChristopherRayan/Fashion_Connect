import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { CustomOrder } from '../../models/customOrder.model.js';
import { Order } from '../../models/order.model.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import { notificationService } from '../../services/notificationService.js';
import { messageService } from '../../services/messageService.js';

// Helper function to get sample images for different product types
const getSampleImageForProductType = (productType) => {
  const sampleImages = {
    'Tradi suit': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop',
    'Traditional suit': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop',
    'Business suit': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    'Wedding dress': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop',
    'Dress': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop',
    'Shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    'Traditional outfit': 'https://images.unsplash.com/photo-1609205811335-8ef8bea5e3b7?w=400&h=400&fit=crop'
  };
  
  // Find matching image or use default
  const lowerProductType = productType.toLowerCase();
  for (const [key, image] of Object.entries(sampleImages)) {
    if (lowerProductType.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerProductType)) {
      return image;
    }
  }
  
  // Default fallback image
  return 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop';
};

// Create custom order
const createCustomOrder = asyncHandler(async (req, res) => {
  const {
    productType,
    productReference,
    designer,
    color,
    measurements,
    expectedDeliveryDate,
    deliveryLocation,
    additionalNotes,
    estimatedPrice,
    deliveryType,
    deliveryTimePrice,
    collectionMethod,
    designerShopAddress
  } = req.body;

  const userId = req.user._id;

  console.log('Creating custom order for user:', userId);
  console.log('Request body:', req.body);

  // Validate required fields
  if (!productType || !designer || !color || !expectedDeliveryDate) {
    throw new ApiError(400, 'Missing required fields: productType, designer, color, expectedDeliveryDate');
  }

  // Make deliveryLocation required only if collectionMethod is delivery
  if (collectionMethod === 'delivery' && !deliveryLocation) {
    throw new ApiError(400, 'Delivery location is required when collection method is delivery');
  }

  // Validate designer exists
  const designerUser = await User.findById(designer);
  if (!designerUser || designerUser.role !== 'DESIGNER') {
    throw new ApiError(404, 'Designer not found');
  }

  // Validate product reference if provided
  let productData = null;
  if (productReference?.productId) {
    productData = await Product.findById(productReference.productId);
    if (!productData) {
      throw new ApiError(404, 'Referenced product not found');
    }
  }

  // Create custom order
  const customOrder = await CustomOrder.create({
    user: userId,
    designer,
    productType,
    productReference,
    color,
    measurements,
    expectedDeliveryDate: new Date(expectedDeliveryDate),
    deliveryLocation: collectionMethod === 'delivery' ? deliveryLocation : '',
    additionalNotes,
    estimatedPrice: estimatedPrice || 0,
    status: 'pending',
    // Add new fields
    deliveryType: deliveryType || 'standard',
    deliveryTimePrice: deliveryTimePrice || 0,
    collectionMethod: collectionMethod || 'delivery',
    designerShopAddress: collectionMethod === 'pickup' ? designerShopAddress : ''
  });

  // Populate the created order
  const populatedOrder = await CustomOrder.findById(customOrder._id)
    .populate('user', 'name email phone')
    .populate('designer', 'name email businessName')
    .populate('productReference.productId', 'name images price');

  console.log('Custom order created successfully:', customOrder._id);

  // Start conversation with designer
  try {
    const conversationData = {
      designerId: designer,
      productId: productReference?.productId,
      message: `New custom order request for ${productType}`,
      customOrderId: customOrder._id
    };

    // Create professional custom order message
    const clientName = populatedOrder.user.name;
    const designerName = populatedOrder.designer.name || populatedOrder.designer.businessName;
    const productName = productData ? productData.name : productType;

    let messageText = `🎨 **CUSTOM ORDER REQUEST**\n\n`;
    messageText += `Dear ${designerName},\n\n`;
    messageText += `I hope this message finds you well. I would like to request a custom order based on your expertise and craftsmanship.\n\n`;

    messageText += `**📋 ORDER DETAILS**\n`;
    messageText += `• **Product Type:** ${productType}\n`;
    if (productData) {
      messageText += `• **Reference Product:** ${productData.name}\n`;
    }
    messageText += `• **Preferred Color:** ${color}\n`;
    messageText += `• **Expected Delivery:** ${new Date(expectedDeliveryDate).toLocaleDateString()}\n`;
    messageText += `• **Delivery Location:** ${deliveryLocation}\n`;
    if (estimatedPrice && estimatedPrice > 0) {
      messageText += `• **Budget Range:** MWK ${estimatedPrice.toLocaleString()}\n`;
    }

    if (Object.keys(measurements).length > 0) {
      messageText += `\n**📏 MEASUREMENTS**\n`;
      Object.entries(measurements).forEach(([key, value]) => {
        if (value && value.trim()) {
          const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          messageText += `• **${label}:** ${value} cm\n`;
        }
      });
    }

    if (additionalNotes && additionalNotes.trim()) {
      messageText += `\n**💭 ADDITIONAL NOTES**\n${additionalNotes}\n`;
    }

    messageText += `\n**👤 CLIENT INFORMATION**\n`;
    messageText += `• **Name:** ${clientName}\n`;
    messageText += `• **Email:** ${populatedOrder.user.email}\n`;
    if (populatedOrder.user.phone) {
      messageText += `• **Phone:** ${populatedOrder.user.phone}\n`;
    }

    messageText += `\n---\n`;
    messageText += `Please review this request and let me know your availability, timeline, and any questions you might have. I look forward to working with you!\n\n`;
    messageText += `Best regards,\n${clientName}`;

    messageText += `\n\n*This is an automated message from FashionConnect. Order ID: ${customOrder._id}*`;

    const conversation = await messageService.startConversationWithDesigner(
      userId,
      designer,
      messageText,
      productReference?.productId,
      productReference?.productImage
    );

    console.log('✅ Conversation started for custom order:', conversation._id);
  } catch (conversationError) {
    console.error('Failed to start conversation for custom order:', conversationError.message);
    // Don't fail the custom order creation if conversation fails
  }

  // Send notification to designer
  try {
    await notificationService.notifyDesignerNewCustomOrder(populatedOrder);
    console.log('✅ Designer notification sent for custom order:', customOrder._id);
  } catch (notificationError) {
    console.error('Failed to send designer notification:', notificationError.message);
  }

  return res.status(201).json(
    new ApiResponse(201, populatedOrder, 'Custom order created successfully')
  );
});

// Get user's custom orders
const getMyCustomOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, sortBy = 'createdAt', sortType = 'desc' } = req.query;
  const userId = req.user._id;

  const query = { user: userId };
  if (status) {
    query.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortType === 'desc' ? -1 : 1 },
    populate: [
      { path: 'designer', select: 'name businessName email' },
      { path: 'productReference.productId', select: 'name images price' }
    ]
  };

  const customOrders = await CustomOrder.paginate(query, options);
  return res.status(200).json(
    new ApiResponse(200, customOrders, 'Custom orders fetched successfully')
  );
});

// Get custom order by ID
const getCustomOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  console.log('🔍 getCustomOrderById called for order:', orderId);
  console.log('👤 User:', userId, 'Role:', userRole);

  // First try to find in Order collection (for transformed custom orders)
  let order = await Order.findOne({ _id: orderId, isCustomOrder: true })
    .populate('buyer', 'name email phone')
    .populate('designer', 'name email businessName')
    .populate('items.product', 'name images price');

  if (order) {
    console.log('✅ Found order in Order collection');
    
    // Check authorization
    const isOwner = order.buyer._id.toString() === userId.toString();
    const isDesigner = order.designer._id.toString() === userId.toString();
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isDesigner && !isAdmin) {
      throw new ApiError(403, 'You are not authorized to view this custom order');
    }

    // Transform Order to CustomOrder format for frontend compatibility
    const transformedOrder = {
      id: order._id,
      _id: order._id,
      user: order.buyer, // Map buyer to user for frontend compatibility
      designer: order.designer,
      productType: order.items && order.items.length > 0 ? order.items[0].name : 'Custom Item',
      color: order.items && order.items.length > 0 ? order.items[0].color || 'Not specified' : 'Not specified',
      measurements: order.customDetails?.measurements || {},
      expectedDeliveryDate: order.customDetails?.deadline || order.createdAt,
      deliveryLocation: order.shippingAddress ? `${order.shippingAddress.street}, ${order.shippingAddress.city}` : 'Not specified',
      additionalNotes: order.notes || order.customDetails?.designNotes || '',
      estimatedPrice: order.totalAmount || 0,
      status: order.status.toLowerCase(),
      assignedTailor: null, // Orders don't have assigned tailors yet
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      // Include original order fields for compatibility
      originalOrder: order
    };

    return res.status(200).json(
      new ApiResponse(200, transformedOrder, 'Custom order details fetched successfully')
    );
  }

  // Fallback: try to find in CustomOrder collection (for legacy custom orders)
  const customOrder = await CustomOrder.findById(orderId)
    .populate('user', 'name email phone')
    .populate('designer', 'name email businessName')
    .populate('productReference.productId', 'name images price');

  if (!customOrder) {
    console.log('❌ Order not found in either collection');
    throw new ApiError(404, 'Custom order not found');
  }

  console.log('✅ Found order in CustomOrder collection (legacy)');

  // Check authorization
  const isOwner = customOrder.user._id.toString() === userId.toString();
  const isDesigner = customOrder.designer._id.toString() === userId.toString();
  const isAdmin = userRole === 'ADMIN';

  if (!isOwner && !isDesigner && !isAdmin) {
    throw new ApiError(403, 'You are not authorized to view this custom order');
  }

  return res.status(200).json(
    new ApiResponse(200, customOrder, 'Custom order details fetched successfully')
  );
});

// Update custom order status (designer only)
const updateCustomOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, notes, estimatedPrice, estimatedDeliveryDate } = req.body;
  const designerId = req.user._id;

  // Verify the requester is a designer
  if (req.user.role !== 'DESIGNER') {
    throw new ApiError(403, 'Only designers can update custom order status');
  }

  const customOrder = await CustomOrder.findOne({ _id: orderId, designer: designerId });
  if (!customOrder) {
    throw new ApiError(404, 'Custom order not found or you do not have permission to update it');
  }

  // Define valid status transitions for designers
  const validDesignerStatuses = [
    'pending', 'accepted', 'assigned_to_tailor', 'ready_for_shipping', 
    'shipped', 'completed', 'cancelled', 'rejected'
  ];

  if (!validDesignerStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid status for designer');
  }

  // Prevent designers from setting tailor-specific statuses
  if (['processing', 'tailor_completed'].includes(status)) {
    throw new ApiError(400, 'Only tailors can set this status');
  }

  const oldStatus = customOrder.status;
  customOrder.status = status;

  if (notes) {
    customOrder.designerNotes = notes;
  }

  if (estimatedPrice !== undefined) {
    customOrder.estimatedPrice = estimatedPrice;
  }

  if (estimatedDeliveryDate) {
    customOrder.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
  }

  // Add to status history
  customOrder.statusHistory.push({
    status,
    changedBy: designerId,
    notes
  });

  await customOrder.save();

  // Populate for response
  const populatedOrder = await CustomOrder.findById(customOrder._id)
    .populate('user', 'name email phone')
    .populate('designer', 'name businessName email')
    .populate('assignedTailor', 'name email')
    .populate('productReference.productId', 'name images price');

  // Send notification to customer
  try {
    await notificationService.notifyCustomerCustomOrderUpdate(populatedOrder, oldStatus);
    console.log('✅ Customer notification sent for custom order update:', customOrder._id);
  } catch (notificationError) {
    console.error('Failed to send customer notification:', notificationError.message);
  }

  // Emit socket event for real-time updates
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${populatedOrder.user._id}`).emit('orderStatusUpdate', {
      orderId: customOrder._id,
      status,
      updatedBy: 'designer'
    });

    // Notify tailor if order is assigned
    if (populatedOrder.assignedTailor) {
      io.to(`user_${populatedOrder.assignedTailor._id}`).emit('orderStatusUpdate', {
        orderId: customOrder._id,
        status,
        updatedBy: 'designer'
      });
    }
  }

  return res.status(200).json(
    new ApiResponse(200, populatedOrder, 'Custom order status updated successfully')
  );
});

// Get designer's custom orders
const getDesignerCustomOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortType = 'desc' } = req.query;
  const designerId = req.user._id;

  console.log('🔍 getDesignerCustomOrders called for designer:', designerId);
  console.log('📋 Query params:', { page, limit, status, search, sortBy, sortType });

  // Query the CustomOrder collection directly (this has productReference data)
  const query = { 
    designer: designerId
  };
  
  if (status) {
    query.status = status;
  }
  
  // Add search functionality for CustomOrder collection
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { productType: searchRegex },
      { additionalNotes: searchRegex },
      { designerNotes: searchRegex },
      { 'productReference.productName': searchRegex }
    ];
  }

  console.log('📝 MongoDB query:', JSON.stringify(query, null, 2));

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortType === 'desc' ? -1 : 1 },
    populate: [
      { path: 'user', select: 'name email phone' },
      { path: 'designer', select: 'name email businessName' },
      { path: 'assignedTailor', select: 'name email' },
      { path: 'productReference.productId', select: 'name images price' }
    ]
  };

  const result = await CustomOrder.paginate(query, options);
  
  console.log('📦 Raw custom orders found:', result.docs.length);
  console.log('📊 Pagination info:', {
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page
  });
  
  // Transform CustomOrder data (this already has productReference)
  const transformedLegacyDocs = result.docs.map(order => {
      console.log('🎯 Processing CustomOrder:', order._id, 'productReference:', order.productReference);
      
      // Add fallback productReference if missing
      let productReference = order.productReference;
      if (!productReference?.productId && !productReference?.productImage) {
        // Create a sample productReference based on productType
        productReference = {
          productId: null,
          productName: order.productType,
          productImage: getSampleImageForProductType(order.productType)
        };
        console.log('🔨 Added fallback productReference for order:', order._id);
      }
      
      return {
        id: order._id,
        _id: order._id,
        user: order.user,
        designer: order.designer,
        assignedTailor: order.assignedTailor,
        productType: order.productType,
        productReference: order.productReference?.productId ? {
          productId: order.productReference.productId._id || order.productReference.productId,
          productName: order.productReference.productId.name || order.productReference.productName,
          productImage: order.productReference.productId.images?.[0] || order.productReference.productImage
        } : productReference,
        color: order.color,
        measurements: order.measurements,
        expectedDeliveryDate: order.expectedDeliveryDate,
        deliveryType: order.deliveryType,
        deliveryTimePrice: order.deliveryTimePrice,
        collectionMethod: order.collectionMethod,
        deliveryLocation: order.deliveryLocation,
        additionalNotes: order.additionalNotes,
        estimatedPrice: order.estimatedPrice,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    });

  // Also include new Order collection custom orders to avoid empty designer views
  const newOrders = await Order.find({
    designer: designerId,
    isCustomOrder: true
  })
    .populate([
      { path: 'buyer', select: 'name email phone' },
      { path: 'designer', select: 'name email businessName' },
      { path: 'assignedTailor', select: 'name email' },
      { path: 'items.product', select: 'name images price' }
    ])
    .sort({ createdAt: sortType === 'desc' ? -1 : 1 })
    .limit(options.limit);

  const transformedNewDocs = newOrders.map(o => {
    const firstItem = Array.isArray(o.items) && o.items.length > 0 ? o.items[0] : null;
    const productImage = firstItem?.product?.images?.[0];

    return {
      id: o._id,
      _id: o._id,
      user: o.buyer,
      designer: o.designer,
      assignedTailor: o.assignedTailor,
      productType: firstItem?.name || 'Custom Item',
      productReference: {
        productId: firstItem?.product?._id || null,
        productName: firstItem?.product?.name || (firstItem?.name || 'Custom Item'),
        productImage: productImage || getSampleImageForProductType(firstItem?.name || 'Custom Item')
      },
      color: firstItem?.color || 'Not specified',
      measurements: o.customDetails?.measurements || {},
      expectedDeliveryDate: o.customDetails?.deadline || o.createdAt,
      deliveryType: o.deliveryType || 'standard',
      deliveryTimePrice: o.deliveryTimePrice || 0,
      collectionMethod: o.collectionMethod || 'delivery',
      deliveryLocation: o.shippingAddress ? `${o.shippingAddress.street}, ${o.shippingAddress.city}` : 'Not specified',
      additionalNotes: o.notes || o.customDetails?.designNotes || '',
      estimatedPrice: o.totalAmount || 0,
      status: o.status === 'CONFIRMED' ? 'accepted'
            : o.status === 'PROCESSING' ? 'processing'
            : o.status === 'READY_FOR_SHIPPING' ? 'ready_for_shipping'
            : (o.status || 'processing').toLowerCase(),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt
    };
  });

  // Merge, sort and repaginate combined docs
  const combinedDocs = [...transformedLegacyDocs, ...transformedNewDocs]
    .sort((a, b) => (sortType === 'desc' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt)));

  const startIdx = (parseInt(page) - 1) * parseInt(limit);
  const pagedDocs = combinedDocs.slice(startIdx, startIdx + parseInt(limit));

  const transformedOrders = {
    docs: pagedDocs,
    totalDocs: combinedDocs.length,
    totalPages: Math.max(1, Math.ceil(combinedDocs.length / parseInt(limit))),
    page: parseInt(page),
    limit: parseInt(limit),
    hasNextPage: startIdx + parseInt(limit) < combinedDocs.length,
    hasPrevPage: startIdx > 0
  };
  
  console.log('✨ Transformed orders:', transformedOrders.docs.length);
  
  return res.status(200).json(
    new ApiResponse(200, transformedOrders, 'Designer custom orders fetched successfully')
  );
});

// Cancel custom order (client only)
const cancelCustomOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  const customOrder = await CustomOrder.findOne({ _id: orderId, user: userId });
  if (!customOrder) {
    throw new ApiError(404, 'Custom order not found or you do not have permission to cancel it');
  }

  if (customOrder.status === 'completed' || customOrder.status === 'cancelled') {
    throw new ApiError(400, 'Cannot cancel a completed or already cancelled custom order');
  }

  customOrder.status = 'cancelled';
  customOrder.cancellationReason = reason;
  customOrder.cancelledAt = new Date();
  await customOrder.save();

  // Populate for response
  const populatedOrder = await CustomOrder.findById(customOrder._id)
    .populate('user', 'name email phone')
    .populate('designer', 'name businessName email')
    .populate('productReference.productId', 'name images price');

  // Send notification to designer
  try {
    await notificationService.notifyDesignerCustomOrderCancelled(populatedOrder);
    console.log('✅ Designer notification sent for custom order cancellation:', customOrder._id);
  } catch (notificationError) {
    console.error('Failed to send designer notification:', notificationError.message);
  }

  return res.status(200).json(
    new ApiResponse(200, populatedOrder, 'Custom order cancelled successfully')
  );
});

export {
  createCustomOrder,
  getMyCustomOrders,
  getCustomOrderById,
  updateCustomOrderStatus,
  getDesignerCustomOrders,
  cancelCustomOrder
};
