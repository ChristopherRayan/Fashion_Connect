import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { User } from '../../models/user.model.js';
import { CustomOrder } from '../../models/customOrder.model.js';
import { Order } from '../../models/order.model.js';
import { notificationService } from '../../services/notificationService.js';
import { messageService } from '../../services/messageService.js';
import emailService from '../../services/emailService.js';
import { EmailVerification } from '../../models/emailVerification.model.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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

// Create tailor invitation (Designer only)
const createTailor = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const designerId = req.user._id;

  // Verify the requester is a designer
  if (req.user.role !== 'DESIGNER') {
    throw new ApiError(403, 'Only designers can invite tailors');
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'Email already registered');
  }

  // Check if there's already a pending invitation for this email
  const existingInvitation = await EmailVerification.findOne({ 
    email, 
    type: 'TAILOR_INVITATION',
    isUsed: false 
  });
  
  if (existingInvitation) {
    throw new ApiError(400, 'Invitation already sent to this email');
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Create email verification record for tailor invitation
  await EmailVerification.create({
    email,
    token: verificationToken,
    type: 'TAILOR_INVITATION',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    metadata: {
      designerId,
      designerName: req.user.name,
      designerBusinessName: req.user.businessName,
      invitedTailorName: name,
      invitedTailorPhone: phone
    }
  });

  // Send invitation email to tailor
  const verificationUrl = `${process.env.FRONTEND_URL}/tailor/setup?token=${verificationToken}`;
  
  try {
    await emailService.sendTailorInvitation({
      to: email,
      tailorName: name,
      designerName: req.user.name,
      designerBusinessName: req.user.businessName || req.user.name,
      verificationUrl
    });

    res.status(201).json(
      new ApiResponse(201, { 
        email, 
        name, 
        phone,
        invitationSent: true,
        expiresIn: '24 hours'
      }, 'Tailor invitation sent successfully')
    );
  } catch (error) {
    // Clean up verification record if email fails
    await EmailVerification.deleteOne({ token: verificationToken });
    throw new ApiError(500, 'Failed to send invitation email');
  }
});

// Complete tailor account setup (Public route - used by invited tailors)
const completeTailorSetup = asyncHandler(async (req, res) => {
  const { token, password, confirmPassword, address, specialties, experience } = req.body;

  // Validate password match
  if (password !== confirmPassword) {
    throw new ApiError(400, 'Passwords do not match');
  }

  // Find and validate invitation token
  const invitation = await EmailVerification.findOne({
    token,
    type: 'TAILOR_INVITATION',
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (!invitation) {
    throw new ApiError(400, 'Invalid or expired invitation token');
  }

  // Check if email is already registered
  const existingUser = await User.findOne({ email: invitation.email });
  if (existingUser) {
    throw new ApiError(400, 'Email already registered');
  }

  // Create tailor account
  const tailor = await User.create({
    name: invitation.metadata.invitedTailorName,
    email: invitation.email,
    phone: invitation.metadata.invitedTailorPhone,
    password,
    role: 'TAILOR',
    designerId: invitation.metadata.designerId,
    status: 'ACTIVE',
    verified: true,
    emailVerified: true,
    emailVerifiedAt: new Date(),
    address,
    specialties,
    experience
  });

  // Mark invitation as used
  invitation.isUsed = true;
  invitation.usedAt = new Date();
  await invitation.save();

  // Send notification to designer
  await notificationService.createNotification({
    recipient: invitation.metadata.designerId,
    type: 'SYSTEM_ANNOUNCEMENT',
    title: 'Tailor Account Activated',
    message: `${tailor.name} has completed their account setup and is now available for orders.`,
    data: {
      tailorId: tailor._id,
      customData: {
        tailorName: tailor.name,
        tailorEmail: tailor.email
      }
    }
  });

  // Generate tokens for immediate login
  const accessToken = tailor.generateAccessToken();
  const refreshToken = tailor.generateRefreshToken();

  // Save refresh token
  tailor.refreshToken = refreshToken;
  await tailor.save({ validateBeforeSave: false });

  // Remove sensitive data from response
  const tailorResponse = await User.findById(tailor._id)
    .select('-password -refreshToken')
    .populate('designerId', 'name email businessName');

  // Set cookies
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res
    .status(201)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(201, {
        user: tailorResponse,
        accessToken,
        refreshToken
      }, 'Tailor account setup completed successfully')
    );
});

// Verify tailor invitation token
const verifyTailorInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  console.log('🔍 Verifying invitation token:', token);

  const invitation = await EmailVerification.findOne({
    token,
    type: 'TAILOR_INVITATION',
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  console.log('📋 Invitation found:', invitation ? 'Yes' : 'No');
  if (invitation) {
    console.log('📊 Invitation details:', {
      email: invitation.email,
      isUsed: invitation.isUsed,
      expiresAt: invitation.expiresAt,
      now: new Date(),
      expired: invitation.expiresAt <= new Date()
    });
  } else {
    // Let's check if the token exists at all
    const anyInvitation = await EmailVerification.findOne({ token });
    console.log('🔍 Any invitation with this token:', anyInvitation ? 'Yes' : 'No');
    if (anyInvitation) {
      console.log('📊 Found invitation details:', {
        type: anyInvitation.type,
        isUsed: anyInvitation.isUsed,
        expiresAt: anyInvitation.expiresAt,
        now: new Date(),
        expired: anyInvitation.expiresAt <= new Date()
      });
    }
  }

  if (!invitation) {
    throw new ApiError(400, 'Invalid or expired invitation token');
  }

  res.status(200).json(
    new ApiResponse(200, {
      email: invitation.email,
      tailorName: invitation.metadata.invitedTailorName,
      designerName: invitation.metadata.designerName,
      designerBusinessName: invitation.metadata.designerBusinessName,
      phone: invitation.metadata.invitedTailorPhone
    }, 'Invitation token is valid')
  );
});

// Resend tailor invitation
const resendTailorInvitation = asyncHandler(async (req, res) => {
  const { tailorId } = req.params;
  const designerId = req.user._id;

  // Verify the requester is a designer
  if (req.user.role !== 'DESIGNER') {
    throw new ApiError(403, 'Only designers can resend invitations');
  }

  // Find the existing invitation by tailorId (which is actually the invitation ID)
  const existingInvitation = await EmailVerification.findOne({
    _id: tailorId,
    type: 'TAILOR_INVITATION',
    'metadata.designerId': designerId,
    isUsed: false
  });

  if (!existingInvitation) {
    throw new ApiError(404, 'No pending invitation found');
  }

  // Generate new token and extend expiry
  const newToken = crypto.randomBytes(32).toString('hex');
  const newExpiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Update the existing invitation
  existingInvitation.token = newToken;
  existingInvitation.expiresAt = newExpiryDate;
  existingInvitation.createdAt = new Date();
  await existingInvitation.save();

  // Send new invitation email
  const verificationUrl = `${process.env.FRONTEND_URL}/tailor/setup?token=${newToken}`;
  
  try {
    await emailService.sendTailorInvitation({
      to: existingInvitation.email,
      tailorName: existingInvitation.metadata.invitedTailorName,
      designerName: req.user.name,
      designerBusinessName: req.user.businessName || req.user.name,
      verificationUrl
    });

    res.status(200).json(
      new ApiResponse(200, { 
        message: 'Invitation resent successfully',
        expiresIn: '24 hours'
      }, 'Invitation resent successfully')
    );
  } catch (error) {
    throw new ApiError(500, 'Failed to resend invitation email');
  }
});

// Get tailors for a designer
const getDesignerTailors = asyncHandler(async (req, res) => {
  const designerId = req.user._id;

  // Verify the requester is a designer
  if (req.user.role !== 'DESIGNER') {
    throw new ApiError(403, 'Only designers can view their tailors');
  }

  // Get active tailors
  const tailors = await User.find({ 
    designerId, 
    role: 'TAILOR' 
  })
  .select('-password -refreshToken')
  .sort({ createdAt: -1 });

  // Get pending invitations
  const pendingInvitations = await EmailVerification.find({
    type: 'TAILOR_INVITATION',
    'metadata.designerId': designerId,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  // Get order counts for each tailor - check both collections
  const tailorsWithStats = await Promise.all(
    tailors.map(async (tailor) => {
      // Check Order collection
      const orderCounts = await Order.aggregate([
        { $match: { assignedTailor: tailor._id, isCustomOrder: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // Check CustomOrder collection
      const customOrderCounts = await CustomOrder.aggregate([
        { $match: { assignedTailor: tailor._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const stats = {
        total: 0,
        processing: 0,
        completed: 0
      };

      // Process Order collection stats
      orderCounts.forEach(item => {
        stats.total += item.count;
        if (item._id === 'PROCESSING') stats.processing += item.count;
        if (item._id === 'READY_FOR_SHIPPING') stats.completed += item.count;
      });

      // Process CustomOrder collection stats (where most assignments are)
      customOrderCounts.forEach(item => {
        stats.total += item.count;
        if (item._id === 'processing') stats.processing += item.count;
        if (item._id === 'tailor_completed') stats.completed += item.count;
      });

      return {
        ...tailor.toObject(),
        id: tailor._id.toString(),
        orderStats: stats,
        isPendingInvitation: false,
        accountStatus: tailor.status
      };
    })
  );

  // Add pending invitations to the list
  const pendingInvitationObjects = pendingInvitations.map(invitation => ({
    id: invitation._id.toString(),
    name: invitation.metadata.invitedTailorName,
    email: invitation.email,
    phone: invitation.metadata.invitedTailorPhone,
    role: 'TAILOR',
    designerId: invitation.metadata.designerId,
    isPendingInvitation: true,
    expiresAt: invitation.expiresAt,
    accountStatus: 'PENDING',
    createdAt: invitation.createdAt,
    orderStats: {
      total: 0,
      processing: 0,
      completed: 0
    }
  }));

  // Combine tailors and pending invitations
  const allTailors = [...tailorsWithStats, ...pendingInvitationObjects];

  res.status(200).json(
    new ApiResponse(200, allTailors, 'Tailors and invitations retrieved successfully')
  );
});

// Get individual tailor details (for designers to view)
const getTailorDetails = asyncHandler(async (req, res) => {
  const { tailorId } = req.params;
  const designerId = req.user._id;

  // Verify the requester is a designer
  if (req.user.role !== 'DESIGNER') {
    throw new ApiError(403, 'Only designers can view tailor details');
  }

  // Find the tailor
  const tailor = await User.findOne({
    _id: tailorId,
    designerId,
    role: 'TAILOR'
  }).select('-password -refreshToken');

  if (!tailor) {
    throw new ApiError(404, 'Tailor not found');
  }

  // Get order statistics from both Order (new) and CustomOrder (legacy)
  const orderCountsNew = await Order.aggregate([
    { $match: { assignedTailor: tailor._id, isCustomOrder: true } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const orderCountsLegacy = await CustomOrder.aggregate([
    { $match: { assignedTailor: tailor._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const stats = {
    total: 0,
    processing: 0,
    completed: 0,
    pending: 0
  };

  // Map new Order statuses
  orderCountsNew.forEach(item => {
    stats.total += item.count;
    if (item._id === 'CONFIRMED') stats.pending += item.count;
    if (item._id === 'PROCESSING') stats.processing += item.count;
    if (item._id === 'READY_FOR_SHIPPING') stats.completed += item.count;
  });

  // Map legacy CustomOrder statuses
  orderCountsLegacy.forEach(item => {
    stats.total += item.count;
    if (item._id === 'assigned_to_tailor') stats.pending += item.count;
    if (item._id === 'processing') stats.processing += item.count;
    if (item._id === 'tailor_completed') stats.completed += item.count;
  });

  // Get recent orders from both collections
  const recentOrdersNew = await Order.find({
    assignedTailor: tailor._id,
    isCustomOrder: true
  })
    .populate([
      { path: 'buyer', select: 'name email' },
      { path: 'designer', select: 'name businessName' }
    ])
    .sort({ createdAt: -1 })
    .limit(5);

  const recentOrdersLegacy = await CustomOrder.find({
    assignedTailor: tailor._id
  })
  .populate([
    { path: 'user', select: 'name email' },
    { path: 'designer', select: 'name businessName' }
  ])
  .sort({ createdAt: -1 })
    .limit(5);

  // Normalize recent orders into a similar shape
  const normalizedRecentOrdersNew = recentOrdersNew.map(o => ({
    _id: o._id,
    orderNumber: o.orderNumber || String(o._id).slice(-6).toUpperCase(),
    status: o.status === 'CONFIRMED' ? 'assigned_to_tailor'
           : o.status === 'PROCESSING' ? 'processing'
           : o.status === 'READY_FOR_SHIPPING' ? 'tailor_completed'
           : (o.status || 'processing').toLowerCase(),
    totalAmount: o.totalAmount || 0,
    createdAt: o.createdAt,
    user: { name: o.buyer?.name || 'Customer', email: o.buyer?.email },
    designer: { name: o.designer?.name, businessName: o.designer?.businessName }
  }));

  const recentOrders = [...normalizedRecentOrdersNew, ...recentOrdersLegacy]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  const tailorDetails = {
    ...tailor.toObject(),
    orderStats: stats,
    recentOrders
  };

  res.status(200).json(
    new ApiResponse(200, tailorDetails, 'Tailor details retrieved successfully')
  );
});

// Get assigned orders for tailor
const getTailorOrders = asyncHandler(async (req, res) => {
  const tailorId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  console.log('🔍 getTailorOrders called for tailor:', tailorId);
  console.log('📋 Query params:', { status, page, limit });
  console.log('👤 User role:', req.user.role);
  console.log('👤 User name:', req.user.name);

  // Verify the requester is a tailor
  if (req.user.role !== 'TAILOR') {
    throw new ApiError(403, 'Only tailors can view their assigned orders');
  }

  // Query Order collection for assigned custom orders
  const query = { 
    assignedTailor: tailorId,
    isCustomOrder: true
  };
  
  if (status) {
    // Map tailor status to Order status
    const statusMapping = {
      'assigned_to_tailor': 'CONFIRMED',
      'processing': 'PROCESSING',
      'tailor_completed': 'READY_FOR_SHIPPING'
    };
    query.status = statusMapping[status] || status.toUpperCase();
  }

  console.log('📝 MongoDB query for Order collection:', JSON.stringify(query, null, 2));

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'buyer', select: 'name email phone' },
      { path: 'designer', select: 'name email businessName' },
      { path: 'assignedTailor', select: 'name email' },
      { path: 'items.product', select: 'name images price' }
    ]
  };

  const result = await Order.paginate(query, options);
  
  console.log('📦 Raw assigned orders found in Order collection:', result.docs.length);
  console.log('📊 Pagination info:', {
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page
  });

  // Also check CustomOrder collection for legacy orders
  const customOrderQuery = { assignedTailor: tailorId };
  if (status) {
    customOrderQuery.status = status;
  }
  
  console.log('📝 MongoDB query for CustomOrder collection:', JSON.stringify(customOrderQuery, null, 2));
  
  const customOrderResult = await CustomOrder.paginate(customOrderQuery, {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'user', select: 'name email phone' },
      { path: 'designer', select: 'name email businessName' },
      { path: 'assignedTailor', select: 'name email' },
      { path: 'productReference.productId', select: 'name images price' }
    ]
  });
  
  console.log('📦 Raw assigned orders found in CustomOrder collection:', customOrderResult.docs.length);
  
  // Transform CustomOrder data to ensure productReference exists
  const transformedCustomOrders = customOrderResult.docs.map(order => {
    console.log('🎯 Processing CustomOrder for tailor:', order._id, 'productReference:', order.productReference);
    
    // Add fallback productReference if missing
    let productReference = order.productReference;
    if (!productReference?.productId && !productReference?.productImage) {
      // Create a sample productReference based on productType
      productReference = {
        productId: null,
        productName: order.productType,
        productImage: getSampleImageForProductType(order.productType)
      };
      console.log('🔨 Added fallback productReference for tailor order:', order._id);
    }
    
    return {
      ...order.toObject(),
      productReference: order.productReference?.productId ? {
        productId: order.productReference.productId._id || order.productReference.productId,
        productName: order.productReference.productId.name || order.productReference.productName,
        productImage: order.productReference.productId.images?.[0] || order.productReference.productImage
      } : productReference
    };
  });
  
  // Transform Order data to CustomOrder format for frontend compatibility
  const transformedOrderData = result.docs.map(order => {
    // Add fallback productReference if missing from Order collection
    let productReference = null;
    if (order.items && order.items.length > 0) {
      productReference = {
        productId: order.items[0].product?._id,
        productName: order.items[0].product?.name || order.items[0].name,
        productImage: order.items[0].product?.images?.[0]
      };
    }
    
    // If no product image, create fallback based on product type
    if (!productReference?.productImage) {
      const productType = order.items && order.items.length > 0 ? order.items[0].name : 'Custom Item';
      productReference = productReference || {};
      productReference.productImage = getSampleImageForProductType(productType);
      console.log('🔨 Added fallback image for tailor order:', order._id, 'productType:', productType);
    }
    
    return {
      id: order._id,
      _id: order._id,
      user: order.buyer, // Map buyer to user for frontend compatibility
      designer: order.designer,
      assignedTailor: order.assignedTailor,
      productType: order.items && order.items.length > 0 ? order.items[0].name : 'Custom Item',
      productReference: productReference,
      color: order.items && order.items.length > 0 ? order.items[0].color || 'Not specified' : 'Not specified',
      measurements: order.customDetails?.measurements || {},
      expectedDeliveryDate: order.customDetails?.deadline || order.createdAt,
      deliveryLocation: order.shippingAddress ? `${order.shippingAddress.street}, ${order.shippingAddress.city}` : 'Not specified',
      additionalNotes: order.notes || order.customDetails?.designNotes || '',
      estimatedPrice: order.totalAmount || 0,
      status: order.status === 'CONFIRMED' ? 'assigned_to_tailor' : 
              order.status === 'PROCESSING' ? 'processing' :
              order.status === 'READY_FOR_SHIPPING' ? 'tailor_completed' :
              order.status.toLowerCase(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      // Include original order fields for compatibility
      originalOrder: order
    };
  });
  
  // Combine both collections - prioritize CustomOrder data since that's where the assignments are
  const allOrders = [...transformedCustomOrders, ...transformedOrderData];
  
  const transformedOrders = {
    docs: allOrders,
    totalDocs: customOrderResult.totalDocs + result.totalDocs,
    totalPages: Math.max(customOrderResult.totalPages, result.totalPages),
    page: parseInt(page),
    limit: parseInt(limit),
    hasNextPage: customOrderResult.hasNextPage || result.hasNextPage,
    hasPrevPage: customOrderResult.hasPrevPage || result.hasPrevPage
  };
  
  console.log('✨ Total transformed tailor orders:', transformedOrders.docs.length);
  console.log('📋 Sample order details:', transformedOrders.docs.length > 0 ? {
    id: transformedOrders.docs[0].id,
    status: transformedOrders.docs[0].status,
    productType: transformedOrders.docs[0].productType
  } : 'No orders found');

  res.status(200).json(
    new ApiResponse(200, transformedOrders, 'Tailor orders retrieved successfully')
  );
});

// Get tailor order by ID for detail view
const getTailorOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const tailorId = req.user._id;

  console.log('🔍 getTailorOrderById called for order:', orderId);
  console.log('👤 Tailor:', tailorId);

  // Verify the requester is a tailor
  if (req.user.role !== 'TAILOR') {
    throw new ApiError(403, 'Only tailors can view order details');
  }

  // First try to find in Order collection
  let order = await Order.findOne({
    _id: orderId,
    assignedTailor: tailorId,
    isCustomOrder: true
  }).populate([
    { path: 'buyer', select: 'name email phone' },
    { path: 'designer', select: 'name email businessName' },
    { path: 'assignedTailor', select: 'name email' },
    { path: 'items.product', select: 'name images price' }
  ]);

  if (order) {
    console.log('✅ Found order in Order collection');
    
    // Transform to CustomOrder format
    const transformedOrder = {
      id: order._id,
      _id: order._id,
      user: order.buyer,
      designer: order.designer,
      assignedTailor: order.assignedTailor,
      productType: order.items && order.items.length > 0 ? order.items[0].name : 'Custom Item',
      productReference: order.items && order.items.length > 0 ? {
        productId: order.items[0].product?._id,
        productName: order.items[0].product?.name,
        productImage: order.items[0].product?.images?.[0] || getSampleImageForProductType(order.items[0].name || 'Custom Item')
      } : {
        productId: null,
        productName: 'Custom Item',
        productImage: getSampleImageForProductType('Custom Item')
      },
      color: order.items && order.items.length > 0 ? order.items[0].color || 'Not specified' : 'Not specified',
      measurements: order.customDetails?.measurements || {},
      expectedDeliveryDate: order.customDetails?.deadline || order.createdAt,
      deliveryLocation: order.shippingAddress ? `${order.shippingAddress.street}, ${order.shippingAddress.city}` : 'Not specified',
      additionalNotes: order.notes || order.customDetails?.designNotes || '',
      estimatedPrice: order.totalAmount || 0,
      status: order.status === 'CONFIRMED' ? 'assigned_to_tailor' : 
              order.status === 'PROCESSING' ? 'processing' :
              order.status === 'READY_FOR_SHIPPING' ? 'tailor_completed' :
              order.status.toLowerCase(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    return res.status(200).json(
      new ApiResponse(200, transformedOrder, 'Order details retrieved successfully')
    );
  }

  // Fallback: try CustomOrder collection
  const customOrder = await CustomOrder.findOne({
    _id: orderId,
    assignedTailor: tailorId
  }).populate([
    { path: 'user', select: 'name email phone' },
    { path: 'designer', select: 'name email businessName' },
    { path: 'assignedTailor', select: 'name email' },
    { path: 'productReference.productId', select: 'name images price' }
  ]);

  if (!customOrder) {
    console.log('❌ Order not found in either collection');
    throw new ApiError(404, 'Order not found or not assigned to you');
  }

  console.log('✅ Found order in CustomOrder collection');

  // Add fallback productReference if missing
  let responseOrder = { ...customOrder.toObject() };
  if (!customOrder.productReference?.productId && !customOrder.productReference?.productImage) {
    responseOrder.productReference = {
      productId: null,
      productName: customOrder.productType,
      productImage: getSampleImageForProductType(customOrder.productType)
    };
    console.log('🔨 Added fallback productReference for tailor order detail:', customOrder._id);
  }

  res.status(200).json(
    new ApiResponse(200, responseOrder, 'Order details retrieved successfully')
  );
});

// Update order status (Tailor only)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, notes } = req.body;
  const tailorId = req.user._id;

  console.log('🔍 updateOrderStatus called for order:', orderId);
  console.log('👤 Tailor:', tailorId, 'New status:', status);

  // Verify the requester is a tailor
  if (req.user.role !== 'TAILOR') {
    throw new ApiError(403, 'Only tailors can update order status');
  }

  // Valid status transitions for tailors
  const validTailorStatuses = ['processing', 'tailor_completed'];
  if (!validTailorStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid status for tailor');
  }

  // Map tailor statuses to Order statuses
  const statusMapping = {
    'processing': 'PROCESSING',
    'tailor_completed': 'READY_FOR_SHIPPING'
  };

  // First try to find in Order collection (for transformed custom orders)
  let order = await Order.findOne({
    _id: orderId,
    assignedTailor: tailorId,
    isCustomOrder: true
  }).populate([
    { path: 'buyer', select: 'name email' },
    { path: 'designer', select: 'name email' },
    { path: 'assignedTailor', select: 'name email' }
  ]);

  if (order) {
    console.log('✅ Found order in Order collection');
    
    // Update order status
    const oldStatus = order.status;
    order.status = statusMapping[status];
    
    if (notes) {
      order.notes = (order.notes || '') + (order.notes ? '\n' : '') + `Tailor update: ${notes}`;
    }

    await order.save();
    
    console.log('✅ Order status updated from', oldStatus, 'to', order.status);

    // Send notifications
    if (status === 'tailor_completed') {
      // Notify designer
      await notificationService.createNotification({
        recipient: order.designer._id,
        type: 'ORDER_STATUS_UPDATED',
        title: 'Order Completed by Tailor',
        message: `Order #${order._id.toString().slice(-6)} has been completed by your tailor and is ready for shipping verification.`,
        data: {
          orderId: order._id,
          customData: {
            status,
            tailorName: req.user.name
          }
        }
      });

      // Notify buyer
      await notificationService.createNotification({
        recipient: order.buyer._id,
        type: 'ORDER_STATUS_UPDATED',
        title: 'Order Update',
        message: `Your custom order #${order._id.toString().slice(-6)} has been completed and is being prepared for shipping.`,
        data: {
          orderId: order._id,
          customData: {
            status
          }
        }
      });
    }

    // Emit socket events for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.designer._id}`).emit('orderStatusUpdate', {
        orderId: order._id,
        status,
        updatedBy: 'tailor',
        tailorName: req.user.name
      });

      io.to(`user_${order.buyer._id}`).emit('orderStatusUpdate', {
        orderId: order._id,
        status
      });
    }

    // Transform Order to CustomOrder format for response
    const transformedOrder = {
      id: order._id,
      _id: order._id,
      user: order.buyer,
      designer: order.designer,
      assignedTailor: order.assignedTailor,
      productType: order.items && order.items.length > 0 ? order.items[0].name : 'Custom Item',
      color: order.items && order.items.length > 0 ? order.items[0].color || 'Not specified' : 'Not specified',
      measurements: order.customDetails?.measurements || {},
      expectedDeliveryDate: order.customDetails?.deadline || order.createdAt,
      deliveryLocation: order.shippingAddress ? `${order.shippingAddress.street}, ${order.shippingAddress.city}` : 'Not specified',
      additionalNotes: order.notes || order.customDetails?.designNotes || '',
      estimatedPrice: order.totalAmount || 0,
      status: status, // Use the tailor-friendly status name
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    return res.status(200).json(
      new ApiResponse(200, transformedOrder, 'Order status updated successfully')
    );
  }

  // Fallback: try CustomOrder collection (for legacy orders)
  const customOrder = await CustomOrder.findOne({
    _id: orderId,
    assignedTailor: tailorId
  }).populate([
    { path: 'user', select: 'name email' },
    { path: 'designer', select: 'name email' }
  ]);

  if (!customOrder) {
    console.log('❌ Order not found in either collection');
    throw new ApiError(404, 'Order not found or not assigned to you');
  }

  console.log('✅ Found order in CustomOrder collection (legacy)');

  // Update order status and add to history
  const oldStatus = customOrder.status;
  customOrder.status = status;
  if (notes) {
    customOrder.tailorNotes = notes;
  }

  // Add to status history
  customOrder.statusHistory.push({
    status,
    changedBy: tailorId,
    notes
  });

  await customOrder.save();

  // Send notifications (same as above)
  if (status === 'tailor_completed') {
    // Notify designer
    await notificationService.createNotification({
      recipient: customOrder.designer._id,
      type: 'ORDER_STATUS_UPDATED',
      title: 'Order Completed by Tailor',
      message: `Order #${customOrder._id.toString().slice(-6)} has been completed by your tailor and is ready for shipping verification.`,
      data: {
        orderId: customOrder._id,
        customData: {
          status,
          tailorName: req.user.name
        }
      }
    });

    // Notify buyer
    await notificationService.createNotification({
      recipient: customOrder.user._id,
      type: 'ORDER_STATUS_UPDATED',
      title: 'Order Update',
      message: `Your custom order #${customOrder._id.toString().slice(-6)} has been completed and is being prepared for shipping.`,
      data: {
        orderId: customOrder._id,
        customData: {
          status
        }
      }
    });
  }

  // Emit socket events for real-time updates
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${customOrder.designer._id}`).emit('orderStatusUpdate', {
      orderId: customOrder._id,
      status,
      updatedBy: 'tailor',
      tailorName: req.user.name
    });

    io.to(`user_${customOrder.user._id}`).emit('orderStatusUpdate', {
      orderId: customOrder._id,
      status
    });
  }

  res.status(200).json(
    new ApiResponse(200, customOrder, 'Order status updated successfully')
  );
});

// Get tailor dashboard stats
const getTailorDashboard = asyncHandler(async (req, res) => {
  const tailorId = req.user._id;

  console.log('🔍 getTailorDashboard called for tailor:', tailorId);

  // Verify the requester is a tailor
  if (req.user.role !== 'TAILOR') {
    throw new ApiError(403, 'Only tailors can view dashboard');
  }

  // Get order statistics from Order collection (new custom orders)
  const orderStats = await Order.aggregate([
    { $match: { assignedTailor: tailorId, isCustomOrder: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get legacy CustomOrder statistics
  const customOrderStats = await CustomOrder.aggregate([
    { $match: { assignedTailor: tailorId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    total: 0,
    processing: 0,
    completed: 0,
    pending: 0
  };

  // Process Order collection stats
  orderStats.forEach(item => {
    stats.total += item.count;
    if (item._id === 'CONFIRMED') stats.pending += item.count; // Orders assigned but not started
    if (item._id === 'PROCESSING') stats.processing += item.count;
    if (item._id === 'READY_FOR_SHIPPING') stats.completed += item.count;
  });

  // Process CustomOrder collection stats (legacy)
  customOrderStats.forEach(item => {
    stats.total += item.count;
    if (item._id === 'assigned_to_tailor') stats.pending += item.count;
    if (item._id === 'processing') stats.processing += item.count;
    if (item._id === 'tailor_completed') stats.completed += item.count;
  });

  console.log('📋 Dashboard stats:', stats);

  // Get recent orders from Order collection
  const recentOrders = await Order.find({
    assignedTailor: tailorId,
    isCustomOrder: true
  })
  .populate([
    { path: 'buyer', select: 'name' },
    { path: 'designer', select: 'name businessName' }
  ])
  .sort({ createdAt: -1 })
  .limit(3);

  // Get recent orders from CustomOrder collection (legacy)
  const recentCustomOrders = await CustomOrder.find({
    assignedTailor: tailorId
  })
  .populate([
    { path: 'user', select: 'name' },
    { path: 'designer', select: 'name businessName' }
  ])
  .sort({ createdAt: -1 })
  .limit(2);

  // Transform Order data to match CustomOrder format
  const transformedRecentOrders = recentOrders.map(order => ({
    _id: order._id,
    user: order.buyer, // Map buyer to user
    designer: order.designer,
    productType: order.items && order.items.length > 0 ? order.items[0].name : 'Custom Item',
    status: order.status === 'CONFIRMED' ? 'assigned_to_tailor' : 
            order.status === 'PROCESSING' ? 'processing' :
            order.status === 'READY_FOR_SHIPPING' ? 'tailor_completed' :
            order.status.toLowerCase(),
    createdAt: order.createdAt,
    estimatedPrice: order.totalAmount || 0
  }));

  // Combine and sort all recent orders
  const allRecentOrders = [...transformedRecentOrders, ...recentCustomOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  console.log('📋 Recent orders found:', allRecentOrders.length);

  // Get designer info
  const designer = await User.findById(req.user.designerId)
    .select('name email businessName');

  res.status(200).json(
    new ApiResponse(200, {
      stats,
      recentOrders: allRecentOrders,
      designer
    }, 'Tailor dashboard data retrieved successfully')
  );
});

// Assign order to tailor (Designer only)
const assignOrderToTailor = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { tailorId, notes } = req.body;
  const designerId = req.user._id;

  console.log('🔍 assignOrderToTailor called for order:', orderId);
  console.log('👤 Designer:', designerId, 'Tailor:', tailorId);

  // Verify the requester is a designer
  if (req.user.role !== 'DESIGNER') {
    throw new ApiError(403, 'Only designers can assign orders to tailors');
  }

  // Verify tailor belongs to this designer
  const tailor = await User.findOne({
    _id: tailorId,
    designerId,
    role: 'TAILOR'
  });

  if (!tailor) {
    throw new ApiError(404, 'Tailor not found or not associated with your account');
  }

  console.log('✅ Tailor verified:', tailor.name);

  // First try to find in Order collection (for transformed custom orders)
  let order = await Order.findOne({
    _id: orderId,
    designer: designerId,
    isCustomOrder: true
  }).populate([
    { path: 'buyer', select: 'name email' }
  ]);

  if (order) {
    console.log('✅ Found order in Order collection');
    
    // Set the assignedTailor field and update status
    order.assignedTailor = tailorId;
    order.status = 'CONFIRMED'; // Map to appropriate Order status
    if (notes) {
      order.notes = (order.notes || '') + (order.notes ? '\n' : '') + `Assigned to tailor: ${tailor.name}. ${notes}`;
    } else {
      order.notes = (order.notes || '') + (order.notes ? '\n' : '') + `Assigned to tailor: ${tailor.name}`;
    }

    await order.save();

    console.log('✅ Order assigned to tailor:', tailor.name, 'with ID:', tailorId);

    // Send notification to tailor
    await notificationService.createNotification({
      recipient: tailorId,
      type: 'ORDER_STATUS_UPDATED',
      title: 'New Order Assigned',
      message: `You have been assigned a new custom order #${order._id.toString().slice(-6)} by ${req.user.name}.`,
      data: {
        orderId: order._id,
        customData: {
          designerName: req.user.name,
          customerName: order.buyer.name
        }
      }
    });

    // Send notification to customer
    await notificationService.createNotification({
      recipient: order.buyer._id,
      type: 'ORDER_STATUS_UPDATED',
      title: 'Order Assigned to Tailor',
      message: `Your custom order #${order._id.toString().slice(-6)} has been assigned to a skilled tailor and work will begin soon.`,
      data: {
        orderId: order._id,
        customData: {
          status: 'assigned_to_tailor'
        }
      }
    });

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${tailorId}`).emit('orderAssigned', {
        orderId: order._id,
        designerName: req.user.name
      });

      io.to(`user_${order.buyer._id}`).emit('orderStatusUpdate', {
        orderId: order._id,
        status: 'assigned_to_tailor'
      });
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
      status: 'assigned_to_tailor',
      assignedTailor: {
        _id: tailor._id,
        name: tailor.name,
        email: tailor.email
      },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    return res.status(200).json(
      new ApiResponse(200, transformedOrder, 'Order assigned to tailor successfully')
    );
  }

  // Fallback: try to find in CustomOrder collection (for legacy custom orders)
  order = await CustomOrder.findOne({
    _id: orderId,
    designer: designerId
  }).populate([
    { path: 'user', select: 'name email' }
  ]);

  if (!order) {
    console.log('❌ Order not found in either collection');
    throw new ApiError(404, 'Order not found');
  }

  console.log('✅ Found order in CustomOrder collection (legacy)');

  // Update order (legacy CustomOrder)
  order.assignedTailor = tailorId;
  order.status = 'assigned_to_tailor';
  if (notes) {
    order.designerNotes = notes;
  }

  // Add to status history
  order.statusHistory.push({
    status: 'assigned_to_tailor',
    changedBy: designerId,
    notes: `Assigned to tailor: ${tailor.name}${notes ? `. Notes: ${notes}` : ''}`
  });

  await order.save();

  // Forward messages to tailor
  await messageService.forwardMessagesToTailor(order._id, tailorId, designerId);

  // Send notification to tailor
  await notificationService.createNotification({
    recipient: tailorId,
    type: 'ORDER_STATUS_UPDATED',
    title: 'New Order Assigned',
    message: `You have been assigned a new custom order #${order._id.toString().slice(-6)} by ${req.user.name}.`,
    data: {
      orderId: order._id,
      customData: {
        designerName: req.user.name,
        customerName: order.user.name
      }
    }
  });

  // Send notification to customer
  await notificationService.createNotification({
    recipient: order.user._id,
    type: 'ORDER_STATUS_UPDATED',
    title: 'Order Assigned to Tailor',
    message: `Your custom order #${order._id.toString().slice(-6)} has been assigned to a skilled tailor and work will begin soon.`,
    data: {
      orderId: order._id,
      customData: {
        status: 'assigned_to_tailor'
      }
    }
  });

  // Emit socket events
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${tailorId}`).emit('orderAssigned', {
      orderId: order._id,
      designerName: req.user.name
    });

    io.to(`user_${order.user._id}`).emit('orderStatusUpdate', {
      orderId: order._id,
      status: 'assigned_to_tailor'
    });
  }

  res.status(200).json(
    new ApiResponse(200, order, 'Order assigned to tailor successfully')
  );
});

// Get all tailors and pending invitations (Designer only)
const getTailors = asyncHandler(async (req, res) => {
  const designerId = req.user._id;
  const { page = 1, limit = 10, search, status } = req.query;

  // Verify the requester is a designer
  if (req.user.role !== 'DESIGNER') {
    throw new ApiError(403, 'Only designers can view tailors');
  }

  // Get active tailors
  const tailorQuery = { 
    designerId, 
    role: 'TAILOR' 
  };

  // Add search filter for tailors
  if (search) {
    tailorQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Add status filter for tailors
  if (status && status !== 'PENDING') {
    tailorQuery.status = status === 'ACTIVE' ? 'ACTIVE' : 'DEACTIVATED';
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    select: '-password -refreshToken'
  };

  const tailors = await User.paginate(tailorQuery, options);

  // Get order stats for each tailor - check both collections
  const tailorsWithStats = await Promise.all(
    tailors.docs.map(async (tailor) => {
      // Check Order collection
      const orderCounts = await Order.aggregate([
        { $match: { assignedTailor: tailor._id, isCustomOrder: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // Check CustomOrder collection  
      const customOrderCounts = await CustomOrder.aggregate([
        { $match: { assignedTailor: tailor._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const stats = {
        total: 0,
        processing: 0,
        completed: 0
      };

      // Process Order collection stats
      orderCounts.forEach(item => {
        stats.total += item.count;
        if (item._id === 'PROCESSING') stats.processing += item.count;
        if (item._id === 'READY_FOR_SHIPPING') stats.completed += item.count;
      });

      // Process CustomOrder collection stats (where most assignments are)
      customOrderCounts.forEach(item => {
        stats.total += item.count;
        if (item._id === 'processing') stats.processing += item.count;
        if (item._id === 'tailor_completed') stats.completed += item.count;
      });

      return {
        ...tailor.toObject(),
        orderStats: stats,
        accountStatus: 'ACTIVE',
        canEdit: false, // Designers cannot edit tailor details
        canDelete: false // Designers cannot delete tailors
      };
    })
  );

  // Get pending invitations
  let pendingInvitations = [];
  if (!status || status === 'PENDING') {
    const invitationQuery = {
      'metadata.designerId': designerId,
      type: 'TAILOR_INVITATION',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    };

    if (search) {
      invitationQuery.$or = [
        { 'metadata.invitedTailorName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const invitations = await EmailVerification.find(invitationQuery)
      .sort({ createdAt: -1 });

    pendingInvitations = invitations.map(inv => ({
      _id: inv._id,
      name: inv.metadata.invitedTailorName,
      email: inv.email,
      phone: inv.metadata.invitedTailorPhone,
      status: 'PENDING_VERIFICATION',
      accountStatus: 'PENDING',
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      orderStats: { total: 0, processing: 0, completed: 0 },
      canEdit: false,
      canDelete: false,
      isPendingInvitation: true
    }));
  }

  // Combine results
  const allTailors = [...tailorsWithStats, ...pendingInvitations];
  
  // Apply pagination to combined results if needed
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedResults = allTailors.slice(startIndex, endIndex);

  const result = {
    docs: paginatedResults,
    totalDocs: allTailors.length,
    limit: parseInt(limit),
    page: parseInt(page),
    totalPages: Math.ceil(allTailors.length / parseInt(limit)),
    hasNextPage: endIndex < allTailors.length,
    hasPrevPage: parseInt(page) > 1,
    nextPage: endIndex < allTailors.length ? parseInt(page) + 1 : null,
    prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null
  };

  res.status(200).json(
    new ApiResponse(200, result, 'Tailors and invitations retrieved successfully')
  );
});

// Update tailor status (Designer only)
const updateTailorStatus = asyncHandler(async (req, res) => {
  const { tailorId } = req.params;
  const { isActive } = req.body;
  const designerId = req.user._id;

  // Verify the requester is a designer
  if (req.user.role !== 'DESIGNER') {
    throw new ApiError(403, 'Only designers can update tailor status');
  }

  // Find tailor and verify ownership
  const tailor = await User.findOne({
    _id: tailorId,
    designerId,
    role: 'TAILOR'
  });

  if (!tailor) {
    throw new ApiError(404, 'Tailor not found or not associated with your account');
  }

  // Update status
  tailor.status = isActive ? 'ACTIVE' : 'DEACTIVATED';
  await tailor.save();

  // Send notification to tailor
  await notificationService.createNotification({
    recipient: tailorId,
    type: 'SYSTEM_ANNOUNCEMENT',
    title: 'Account Status Updated',
    message: `Your account has been ${isActive ? 'activated' : 'deactivated'} by ${req.user.name}.`,
    data: {
      customData: {
        status: tailor.status,
        designerName: req.user.name
      }
    }
  });

  res.status(200).json(
    new ApiResponse(200, tailor, 'Tailor status updated successfully')
  );
});

// Get tailor stats (Tailor only)
const getTailorStats = asyncHandler(async (req, res) => {
  const tailorId = req.user._id;

  // Verify the requester is a tailor
  if (req.user.role !== 'TAILOR') {
    throw new ApiError(403, 'Only tailors can view their stats');
  }

  // Get order statistics from Order collection
  const orderStats = await Order.aggregate([
    { $match: { assignedTailor: tailorId, isCustomOrder: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get order statistics from CustomOrder collection
  const customOrderStats = await CustomOrder.aggregate([
    { $match: { assignedTailor: tailorId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    totalAssignedOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    completedThisWeek: 0,
    averageCompletionTime: 0
  };

  // Process Order collection stats
  orderStats.forEach(item => {
    stats.totalAssignedOrders += item.count;
    if (item._id === 'PROCESSING') stats.processingOrders += item.count;
    if (item._id === 'READY_FOR_SHIPPING') stats.completedOrders += item.count;
  });

  // Process CustomOrder collection stats (where most assignments are)
  customOrderStats.forEach(item => {
    stats.totalAssignedOrders += item.count;
    if (item._id === 'processing') stats.processingOrders += item.count;
    if (item._id === 'tailor_completed') stats.completedOrders += item.count;
  });

  // Get completed orders this week from Order collection
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  
  const orderCompletedThisWeek = await Order.countDocuments({
    assignedTailor: tailorId,
    isCustomOrder: true,
    status: 'READY_FOR_SHIPPING',
    updatedAt: { $gte: weekStart }
  });

  // Get completed orders this week from CustomOrder collection
  const customOrderCompletedThisWeek = await CustomOrder.countDocuments({
    assignedTailor: tailorId,
    status: 'tailor_completed',
    updatedAt: { $gte: weekStart }
  });

  stats.completedThisWeek = orderCompletedThisWeek + customOrderCompletedThisWeek;

  res.status(200).json(
    new ApiResponse(200, stats, 'Tailor stats retrieved successfully')
  );
});

// Get tailor profile (Tailor only)
const getTailorProfile = asyncHandler(async (req, res) => {
  const tailorId = req.user._id;

  console.log('🔍 getTailorProfile called for tailor:', tailorId);

  // Verify the requester is a tailor
  if (req.user.role !== 'TAILOR') {
    throw new ApiError(403, 'Only tailors can view their profile');
  }

  const tailor = await User.findById(tailorId)
    .select('-password -refreshToken')
    .populate('designerId', 'name email businessName');

  if (!tailor) {
    throw new ApiError(404, 'Tailor profile not found');
  }

  console.log('📋 Profile data being sent:', {
    id: tailor._id,
    name: tailor.name,
    email: tailor.email,
    phone: tailor.phone,
    address: tailor.address,
    bio: tailor.bio,
    specialties: tailor.specialties,
    experience: tailor.experience,
    profileImage: tailor.profileImage,
    createdAt: tailor.createdAt
  });

  res.status(200).json(
    new ApiResponse(200, tailor, 'Tailor profile retrieved successfully')
  );
});

// Update tailor profile (Tailor only)
const updateTailorProfile = asyncHandler(async (req, res) => {
  const tailorId = req.user._id;
  const { name, phone, experience, bio } = req.body;

  console.log('🔍 updateTailorProfile called for tailor:', tailorId);
  console.log('📋 Request body:', req.body);
  console.log('📁 File uploaded:', req.file ? 'Yes' : 'No');
  console.log('📄 File details:', req.file);

  // Verify the requester is a tailor
  if (req.user.role !== 'TAILOR') {
    throw new ApiError(403, 'Only tailors can update their profile');
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  // Coerce address: allow string (store as { street }) or JSON/object
  if (req.body.address !== undefined) {
    const incomingAddress = req.body.address;
    if (typeof incomingAddress === 'string') {
      // Try parse JSON first, else treat as street string
      try {
        const parsed = JSON.parse(incomingAddress);
        if (parsed && typeof parsed === 'object') {
          updateData.address = parsed;
        } else {
          updateData.address = { street: incomingAddress };
        }
      } catch {
        updateData.address = { street: incomingAddress };
      }
    } else if (typeof incomingAddress === 'object' && incomingAddress !== null) {
      updateData.address = incomingAddress;
    }
  }
  if (bio !== undefined) updateData.bio = bio;
  // Normalize specialties from either 'specialties' or 'specialties[]' (multipart)
  const specialtiesRaw =
    req.body.specialties !== undefined ? req.body.specialties : req.body['specialties[]'];
  if (specialtiesRaw !== undefined) {
    if (Array.isArray(specialtiesRaw)) {
      updateData.specialties = specialtiesRaw.filter(Boolean).map(s => String(s).trim());
    } else if (typeof specialtiesRaw === 'string') {
      // Could be JSON array, CSV, or single value
      try {
        const parsed = JSON.parse(specialtiesRaw);
        updateData.specialties = Array.isArray(parsed)
          ? parsed.filter(Boolean).map(s => String(s).trim())
          : [String(parsed).trim()].filter(Boolean);
      } catch {
        updateData.specialties = specialtiesRaw
          .split(',')
          .map(s => s.trim())
          .filter(s => s);
      }
    }
  }
  if (experience !== undefined) updateData.experience = Number(experience);

  // Handle profile image upload
  if (req.file) {
    console.log('🖼️ Processing profile image upload');
    
    // Get current tailor to check for existing profile image
    const currentTailor = await User.findById(tailorId).select('profileImage');
    const oldImagePath = currentTailor?.profileImage;
    
    // Set new profile image path (relative to uploads directory)
    updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
    
    console.log('📸 New profile image path:', updateData.profileImage);
    
    // Clean up old profile image if exists (optional - you might want to keep for rollback)
    if (oldImagePath && oldImagePath !== updateData.profileImage) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const oldFullPath = path.join(process.cwd(), oldImagePath);
        
        // Check if old file exists before attempting to delete
        if (fs.existsSync(oldFullPath)) {
          fs.unlinkSync(oldFullPath);
          console.log('🗑️ Deleted old profile image:', oldFullPath);
        }
      } catch (error) {
        console.error('⚠️ Failed to delete old profile image:', error.message);
        // Don't throw error - image update should still succeed
      }
    }
  }

  console.log('💾 Final update data:', updateData);

  const updatedTailor = await User.findByIdAndUpdate(
    tailorId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!updatedTailor) {
    throw new ApiError(404, 'Tailor profile not found');
  }

  console.log('✅ Profile updated successfully');
  console.log('🖼️ Updated profile image:', updatedTailor.profileImage);

  res.status(200).json(
    new ApiResponse(200, updatedTailor, 'Profile updated successfully')
  );
});

// Get tailor contacts (designer and other tailors) - Tailor only
const getTailorContacts = asyncHandler(async (req, res) => {
  const tailorId = req.user._id;

  // Verify the requester is a tailor
  if (req.user.role !== 'TAILOR') {
    throw new ApiError(403, 'Only tailors can view their contacts');
  }

  // Get the tailor's designer
  const designer = await User.findById(req.user.designerId)
    .select('name email businessName profileImage');

  if (!designer) {
    throw new ApiError(404, 'Designer not found');
  }

  // Get other tailors working for the same designer
  const otherTailors = await User.find({
    designerId: req.user.designerId,
    role: 'TAILOR',
    _id: { $ne: tailorId }, // Exclude current tailor
    status: 'ACTIVE'
  }).select('name email profileImage specialties experience');

  const contacts = {
    designer: {
      id: designer._id,
      name: designer.name,
      email: designer.email,
      businessName: designer.businessName,
      profileImage: designer.profileImage,
      role: 'DESIGNER',
      isOnline: designer.isOnline || false
    },
    tailors: otherTailors.map(tailor => ({
      id: tailor._id,
      name: tailor.name,
      email: tailor.email,
      profileImage: tailor.profileImage,
      specialties: tailor.specialties || [],
      experience: tailor.experience || 0,
      role: 'TAILOR',
      isOnline: tailor.isOnline || false
    }))
  };

  res.status(200).json(
    new ApiResponse(200, contacts, 'Tailor contacts retrieved successfully')
  );
});

export {
  createTailor,
  completeTailorSetup,
  verifyTailorInvitation,
  resendTailorInvitation,
  getDesignerTailors,
  getTailorDetails,
  getTailorOrders,
  getTailorOrderById,
  updateOrderStatus,
  getTailorDashboard,
  assignOrderToTailor,
  getTailors,
  updateTailorStatus,
  getTailorStats,
  getTailorProfile,
  updateTailorProfile,
  getTailorContacts
};