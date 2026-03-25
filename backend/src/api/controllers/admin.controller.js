import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import { Order } from '../../models/order.model.js';
import { ApiError } from '../../utils/ApiError.js';
import emailService from '../../services/emailService.js';
import fs from 'fs';
import path from 'path';
const getAllUsers = asyncHandler(async (req, res) => {
 const { role, status, page = 1, limit = 50 } = req.query;

 // Build query
 const query = {};
 if (role) query.role = role;
 if (status) query.status = status;

 const skip = (parseInt(page) - 1) * parseInt(limit);

 const users = await User.find(query)
   .select('-password -refreshToken')
   .sort({ createdAt: -1 })
   .skip(skip)
   .limit(parseInt(limit));

 const totalUsers = await User.countDocuments(query);

 const response = {
   docs: users,
   totalDocs: totalUsers,
   limit: parseInt(limit),
   page: parseInt(page),
   totalPages: Math.ceil(totalUsers / parseInt(limit)),
   hasNextPage: parseInt(page) < Math.ceil(totalUsers / parseInt(limit)),
   hasPrevPage: parseInt(page) > 1
 };

 return res.status(200).json(new ApiResponse(200, response, "Users fetched successfully"));
});
const updateUserStatus = asyncHandler(async (req, res) => {
 const { userId } = req.params;
 const { status } = req.body;
 if (!status || !['ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
     throw new ApiError(400, "Invalid status provided");
 }
 const user = await User.findByIdAndUpdate(userId, { status }, { new: true }).select('-password -refreshToken');
 if (!user) {
     throw new ApiError(404, "User not found");
 }
 return res.status(200).json(new ApiResponse(200, user, "User status updated successfully"));
});
// Get pending designers for verification
const getPendingDesigners = asyncHandler(async (req, res) => {
 const pendingDesigners = await User.find({
   role: 'DESIGNER',
   status: 'PENDING_VERIFICATION'
 }).select('-password -refreshToken').sort({ createdAt: -1 });

 // Debug logging for documents
 console.log(`📋 Found ${pendingDesigners.length} pending designers`);
 pendingDesigners.forEach(designer => {
   console.log(`👤 Designer: ${designer.name} (${designer.email})`);
   console.log(`📄 Documents:`, designer.documents);
   if (designer.documents) {
     Object.entries(designer.documents).forEach(([key, value]) => {
       if (value) {
         const filePath = path.join(process.cwd(), value.startsWith('/') ? value.substring(1) : value);
         const fileExists = fs.existsSync(filePath);
         console.log(`  - ${key}: ${value} ${fileExists ? '✅' : '❌ FILE NOT FOUND'}`);
         if (!fileExists) {
           console.log(`    Expected path: ${filePath}`);
         }
       }
     });
   }
 });

 return res.status(200).json(new ApiResponse(200, pendingDesigners, "Pending designers fetched successfully"));
});

// Approve designer
const approveDesigner = asyncHandler(async (req, res) => {
 const { userId } = req.params;

 const designer = await User.findByIdAndUpdate(
   userId,
   { status: 'ACTIVE' },
   { new: true }
 ).select('-password -refreshToken');

 if (!designer) {
   throw new ApiError(404, "Designer not found");
 }

 // Send approval email to designer
 try {
   await emailService.sendEmail(
     designer.email,
     'Designer Account Approved - FashionConnect',
     `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
         <h2 style="color: #333;">🎉 Congratulations! Your Designer Account Has Been Approved</h2>
         <p>Dear ${designer.name},</p>
         <p>Great news! Your designer account on FashionConnect has been approved. You can now:</p>
         <ul>
           <li>Upload and manage your products</li>
           <li>Receive orders from customers</li>
           <li>Access your designer dashboard</li>
           <li>Start earning from your designs</li>
         </ul>
         <p>Login to your account to get started: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/designer/dashboard">Designer Dashboard</a></p>
         <p>Best regards,<br>The FashionConnect Team</p>
       </div>
     `
   );
   console.log(`Approval email sent to designer ${designer.name} (${designer.email})`);
 } catch (error) {
   console.error('Failed to send approval email:', error);
   // Don't fail the request if email fails
 }

 return res.status(200).json(new ApiResponse(200, designer, "Designer approved successfully"));
});

// Reject designer
const rejectDesigner = asyncHandler(async (req, res) => {
 const { userId } = req.params;
 const { reason } = req.body;

 const designer = await User.findByIdAndUpdate(
   userId,
   {
     status: 'SUSPENDED',
     rejectionReason: reason
   },
   { new: true }
 ).select('-password -refreshToken');

 if (!designer) {
   throw new ApiError(404, "Designer not found");
 }

 // Send rejection email to designer
 try {
   await emailService.sendEmail(
     designer.email,
     'Designer Account Application Update - FashionConnect',
     `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
         <h2 style="color: #333;">Designer Account Application Update</h2>
         <p>Dear ${designer.name},</p>
         <p>Thank you for your interest in becoming a designer on FashionConnect.</p>
         <p>After careful review, we regret to inform you that your designer account application has not been approved at this time.</p>
         <p><strong>Reason:</strong> ${reason}</p>
         <p>You may reapply in the future with updated information and documentation.</p>
         <p>If you have any questions, please contact our support team.</p>
         <p>Best regards,<br>The FashionConnect Team</p>
       </div>
     `
   );
   console.log(`Rejection email sent to designer ${designer.name} (${designer.email})`);
 } catch (error) {
   console.error('Failed to send rejection email:', error);
   // Don't fail the request if email fails
 }

 return res.status(200).json(new ApiResponse(200, designer, "Designer rejected successfully"));
});

// Get admin dashboard analytics with real data
const getAdminDashboardAnalytics = asyncHandler(async (req, res) => {
 try {
   // Get real counts from database
   const totalUsers = await User.countDocuments();
   const totalClients = await User.countDocuments({ role: 'CLIENT' });
   const totalDesigners = await User.countDocuments({ role: 'DESIGNER' });
   const pendingVerifications = await User.countDocuments({
     role: 'DESIGNER',
     status: 'PENDING_VERIFICATION'
   });
   const activeDesigners = await User.countDocuments({
     role: 'DESIGNER',
     status: 'ACTIVE'
   });

   const analytics = {
     totalUsers,
     totalClients,
     totalDesigners,
     activeDesigners,
     pendingVerifications,
     // TODO: Add real order and revenue data when Order model is available
     totalOrders: 0,
     totalRevenue: 0,
   };

   return res.status(200).json(new ApiResponse(200, analytics, "Admin analytics fetched successfully"));
 } catch (error) {
   console.error('Error fetching admin analytics:', error);
   throw new ApiError(500, "Failed to fetch admin analytics");
 }
});

// Get all products for content moderation
const getAllProductsForModeration = asyncHandler(async (req, res) => {
 const { page = 1, limit = 20, status, designerId } = req.query;

 // Build query
 const query = {};
 if (status) query.status = status;
 if (designerId) query.designer = designerId;

 const skip = (parseInt(page) - 1) * parseInt(limit);

 const products = await Product.find(query)
   .populate('designer', 'name email')
   .sort({ createdAt: -1 })
   .skip(skip)
   .limit(parseInt(limit));

 const totalProducts = await Product.countDocuments(query);

 const response = {
   docs: products,
   totalDocs: totalProducts,
   limit: parseInt(limit),
   page: parseInt(page),
   totalPages: Math.ceil(totalProducts / parseInt(limit)),
   hasNextPage: parseInt(page) < Math.ceil(totalProducts / parseInt(limit)),
   hasPrevPage: parseInt(page) > 1
 };

 return res.status(200).json(new ApiResponse(200, response, "Products fetched successfully"));
});

// Remove product (content moderation action)
const removeProduct = asyncHandler(async (req, res) => {
 const { productId } = req.params;
 const { reason } = req.body;

 const product = await Product.findById(productId).populate('designer', 'name email');

 if (!product) {
   throw new ApiError(404, "Product not found");
 }

 // Store product info before deletion for notification
 const productInfo = {
   name: product.name,
   designerName: product.designer.name,
   designerEmail: product.designer.email,
   designerId: product.designer._id,
   reason: reason || 'Content policy violation'
 };

 // Remove the product
 await Product.findByIdAndDelete(productId);

 // Send notification to designer about product removal
 try {
   await emailService.sendEmail(
     productInfo.designerEmail,
     'Product Removed - FashionConnect',
     `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
         <h2 style="color: #333;">Product Removed from FashionConnect</h2>
         <p>Dear ${productInfo.designerName},</p>
         <p>Your product "<strong>${productInfo.name}</strong>" has been removed from FashionConnect.</p>
         <p><strong>Reason:</strong> ${productInfo.reason}</p>
         <p>If you believe this was done in error, please contact our support team for review.</p>
         <p>Best regards,<br>The FashionConnect Team</p>
       </div>
     `
   );
   console.log(`Product removal notification sent to designer ${productInfo.designerName} (${productInfo.designerEmail})`);
 } catch (error) {
   console.error('Failed to send product removal notification:', error);
   // Don't fail the request if email fails
 }

 return res.status(200).json(new ApiResponse(200, productInfo, "Product removed successfully"));
});

// Update product status (approve/flag/etc)
const updateProductStatus = asyncHandler(async (req, res) => {
 const { productId } = req.params;
 const { status, reason } = req.body;

 if (!status || !['ACTIVE', 'FLAGGED', 'SUSPENDED'].includes(status)) {
   throw new ApiError(400, "Invalid status provided");
 }

 const product = await Product.findByIdAndUpdate(
   productId,
   {
     status,
     moderationReason: reason
   },
   { new: true }
 ).populate('designer', 'name email');

 if (!product) {
   throw new ApiError(404, "Product not found");
 }

 // Send notification to designer if product was flagged or suspended
 if (status === 'FLAGGED' || status === 'SUSPENDED') {
   try {
     await emailService.sendEmail(
       product.designer.email,
       `Product ${status.charAt(0) + status.slice(1).toLowerCase()} - FashionConnect`,
       `
         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
           <h2 style="color: #333;">Product ${status.charAt(0) + status.slice(1).toLowerCase()} on FashionConnect</h2>
           <p>Dear ${product.designer.name},</p>
           <p>Your product "<strong>${product.name}</strong>" has been ${status.toLowerCase()} on FashionConnect.</p>
           <p><strong>Reason:</strong> ${reason}</p>
           <p>Please review the issue and make necessary changes. You can update your product from your designer dashboard.</p>
           <p>If you have any questions, please contact our support team.</p>
           <p>Best regards,<br>The FashionConnect Team</p>
         </div>
       `
     );
     console.log(`Product ${status.toLowerCase()} notification sent to designer ${product.designer.name} (${product.designer.email})`);
   } catch (error) {
     console.error('Failed to send product status notification:', error);
     // Don't fail the request if email fails
   }
 }

 return res.status(200).json(new ApiResponse(200, product, "Product status updated successfully"));
});

// Get content moderation statistics
const getModerationStats = asyncHandler(async (req, res) => {
 try {
   const totalProducts = await Product.countDocuments();
   const pendingReview = await Product.countDocuments({ status: { $in: ['PENDING', undefined] } });
   const flaggedProducts = await Product.countDocuments({ status: 'FLAGGED' });
   const suspendedProducts = await Product.countDocuments({ status: 'SUSPENDED' });
   const activeProducts = await Product.countDocuments({ status: 'ACTIVE' });

   // Get recent products (last 24 hours) for "new" count
   const yesterday = new Date();
   yesterday.setDate(yesterday.getDate() - 1);
   const newProducts = await Product.countDocuments({
     createdAt: { $gte: yesterday }
   });

   const stats = {
     totalProducts,
     pendingReview,
     flaggedProducts,
     suspendedProducts,
     activeProducts,
     newProducts
   };

   return res.status(200).json(new ApiResponse(200, stats, "Moderation stats fetched successfully"));
 } catch (error) {
   console.error('Error fetching moderation stats:', error);
   throw new ApiError(500, "Failed to fetch moderation stats");
 }
});

// Deactivate user (instead of delete)
const deactivateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Don't allow deactivating admin users
  if (user.role === 'ADMIN') {
    throw new ApiError(403, "Cannot deactivate admin users");
  }

  // Set user status to DEACTIVATED instead of deleting
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      status: 'DEACTIVATED',
      updatedAt: new Date()
    },
    { new: true }
  ).select('-password -refreshToken');

  console.log(`🚫 User "${user.name}" (${user.email}) deactivated by admin`);

  return res.status(200).json(new ApiResponse(200, updatedUser, "User deactivated successfully"));
});

// Update user (restricted to safe fields only)
const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, rejectionReason } = req.body;

  // Don't allow updating admin users
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  if (existingUser.role === 'ADMIN') {
    throw new ApiError(403, "Cannot update admin users");
  }

  // Only allow updating safe fields - no email, name, password, or role changes
  const allowedUpdates = {};

  if (status && ['ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'].includes(status)) {
    allowedUpdates.status = status;
  }

  if (rejectionReason !== undefined) {
    allowedUpdates.rejectionReason = rejectionReason;
  }

  if (Object.keys(allowedUpdates).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { ...allowedUpdates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  console.log(`✏️ User "${user.name}" status updated by admin`);

  return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

// Get all orders for admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, sortBy = 'createdAt', sortType = 'desc' } = req.query;

  // Build query
  const query = {};
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(query)
    .populate('buyer', 'name email')
    .populate('designer', 'name businessName email')
    .populate('items.product', 'name images price')
    .sort({ [sortBy]: sortType === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalOrders = await Order.countDocuments(query);

  const response = {
    orders,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / parseInt(limit)),
      totalOrders,
      hasNextPage: skip + orders.length < totalOrders,
      hasPrevPage: parseInt(page) > 1
    }
  };

  return res.status(200).json(new ApiResponse(200, response, "Orders fetched successfully"));
});

export {
  getAllUsers,
  updateUserStatus,
  getPendingDesigners,
  approveDesigner,
  rejectDesigner,
  getAdminDashboardAnalytics,
  getAllProductsForModeration,
  removeProduct,
  updateProductStatus,
  getModerationStats,
  deactivateUser,
  updateUser,
  getAllOrders
};
