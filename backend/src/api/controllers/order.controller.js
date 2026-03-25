import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Order } from '../../models/order.model.js';
import { Product } from '../../models/product.model.js';
import { User } from '../../models/user.model.js';
import { Conversation, Message } from '../../models/message.model.js';
import { analyticsService } from '../../services/analyticsService.js';
import { notificationService } from '../../services/notificationService.js';
const createOrder = asyncHandler(async (req, res) => {
 const { items, shippingAddress, paymentMethod, notes, isCustomOrder, customDetails } = req.body;
 const userId = req.user._id;

 console.log('Creating order for user:', userId, 'with items:', items.length);

 if (!items || items.length === 0) {
     throw new ApiError(400, "No order items");
 }

 // Validate shipping address
 if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
     throw new ApiError(400, "Complete shipping address is required");
 }

 // For simplicity, assuming all items are from the same designer
 // In a real app, you might split this into multiple orders
 const firstItemProduct = await Product.findById(items[0].product);
 if (!firstItemProduct) {
     throw new ApiError(404, `Product with id ${items[0].product} not found`);
 }
 const designerId = firstItemProduct.designer;
 let totalAmount = 0;

 // Validate all products exist and calculate total
 for (const item of items) {
     const product = await Product.findById(item.product);
     if (!product) {
         throw new ApiError(404, `Product with id ${item.product} not found`);
     }

     // Skip stock validation for custom orders (they're made-to-order)
     if (!isCustomOrder) {
       // Check stock availability - prioritize size-specific stock if available
       let availableStock = product.stockQuantity;
       if (item.size && product.sizeStock && product.sizeStock.length > 0) {
         const sizeStockItem = product.sizeStock.find(sizeItem => sizeItem.size === item.size);
         if (sizeStockItem) {
           availableStock = sizeStockItem.quantity;
         } else {
           throw new ApiError(400, `Size "${item.size}" is not available for product "${product.name}"`);
         }
       }

       if (!product.inStock || availableStock < item.quantity) {
           throw new ApiError(400, `Insufficient stock for product "${product.name}"${item.size ? ` in size ${item.size}` : ''}. Available: ${availableStock}, Requested: ${item.quantity}`);
       }
     }

     totalAmount += (product.discountPrice || product.price) * item.quantity;
 }

 console.log('Order total calculated:', totalAmount);

 const order = await Order.create({
     buyer: userId,
     designer: designerId,
     items,
     totalAmount,
     shippingAddress,
     paymentMethod,
     notes,
     isCustomOrder,
     customDetails
 });

 console.log('Order created successfully:', order._id);

 // Update analytics
 await analyticsService.updateOrderAnalytics(order);

 // Create invoice (don't fail order creation if invoice fails)
 try {
   await analyticsService.createInvoice(order._id);
 } catch (invoiceError) {
   console.error('Failed to create invoice for order:', order._id, invoiceError.message);
   // Continue with order creation even if invoice fails
 }

 // Send notifications
 try {
   // Notify designer about new order
   await notificationService.notifyDesignerNewOrder(order);
   console.log('✅ Designer notification sent for order:', order._id);

   // Notify all admins about new order
   const adminUsers = await User.find({ role: 'ADMIN', status: 'ACTIVE' });
   if (adminUsers.length > 0) {
     await notificationService.notifyAdminNewOrder(order, adminUsers);
     console.log('✅ Admin notifications sent for order:', order._id);
   }
 } catch (notificationError) {
   console.error('Failed to send notifications for order:', order._id, notificationError.message);
   // Continue with order creation even if notifications fail
 }

 // Decrease stock quantity for each ordered item (skip for custom orders)
 if (!isCustomOrder) {
   for (const item of items) {
     const product = await Product.findById(item.product);
     if (product) {
     console.log(`📦 Before stock update for product ${product.name}:`, {
       productId: item.product,
       size: item.size || 'N/A',
       quantityOrdered: item.quantity,
       currentTotalStock: product.stockQuantity,
       currentSizeStock: product.sizeStock || 'N/A'
     });

     // Update size-specific stock if size is specified
     if (item.size && product.sizeStock && product.sizeStock.length > 0) {
       // Update the size-specific stock
       product.sizeStock = product.sizeStock.map(sizeItem => {
         if (sizeItem.size === item.size) {
           return {
             ...sizeItem,
             quantity: Math.max(0, sizeItem.quantity - item.quantity)
           };
         }
         return sizeItem;
       });

       // Calculate new total stock from all sizes
       const newTotalStock = product.sizeStock.reduce((total, sizeItem) => total + sizeItem.quantity, 0);
       product.stockQuantity = newTotalStock;
       product.inStock = newTotalStock > 0;
     } else {
       // Fallback to general stock update for products without size-specific stock
       product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
       product.inStock = product.stockQuantity > 0;
     }

     // Save the product to trigger middleware and ensure proper update
     await product.save();

     console.log(`📦 After stock update for product ${product.name}:`, {
       productId: item.product,
       size: item.size || 'N/A',
       quantityOrdered: item.quantity,
       newTotalStock: product.stockQuantity,
       newSizeStock: product.sizeStock || 'N/A'
     });

     // Send out of stock notification to designer if stock reaches 0
     if (!product.inStock && product.stockQuantity === 0) {
       try {
         await notificationService.createNotification({
           recipient: product.designer,
           type: 'out_of_stock',
           title: 'Product Out of Stock',
           message: `Your product "${product.name}" is now out of stock`,
           data: {
             productId: product._id,
             productName: product.name
           }
         });
       } catch (notificationError) {
         console.error('Failed to send out of stock notification:', notificationError.message);
       }
     }
   }
 }
 }

 // Send custom order details as message to designer
 if (isCustomOrder && customDetails) {
   try {
     // Find or create conversation between buyer and designer
     let conversation = await Conversation.findByParticipants(userId, designerId);
     
     if (!conversation) {
       // Create new conversation
       conversation = await Conversation.create({
         participants: [userId, designerId],
         unreadCount: new Map()
       });
     }

     // Create custom order message
     const customOrderMessage = `🎨 **NEW CUSTOM ORDER** - Order #${order._id}

**Customer Details:**
- Name: ${req.user.name}
- Email: ${req.user.email}
- Phone: ${req.user.phone || 'Not provided'}

**Product:** ${items[0].name}
**Quantity:** ${items[0].quantity}

**Custom Requirements:**
${customDetails.measurements ? `**Measurements:** ${JSON.stringify(customDetails.measurements, null, 2)}` : ''}
${customDetails.deliveryType ? `**Delivery Type:** ${customDetails.deliveryType}` : ''}
${customDetails.expectedDeliveryDate ? `**Expected Delivery:** ${customDetails.expectedDeliveryDate}` : ''}
${customDetails.deliveryLocation ? `**Delivery Location:** ${customDetails.deliveryLocation}` : ''}
${customDetails.additionalNotes ? `**Additional Notes:** ${customDetails.additionalNotes}` : ''}

**Shipping Address:**
${shippingAddress.street}, ${shippingAddress.city}
${shippingAddress.country} ${shippingAddress.zipCode || ''}

**Total Amount:** $${totalAmount}

Please review the custom order details and respond with any questions or confirmations.`;

     // Send the message
     await Message.create({
       conversation: conversation._id,
       sender: userId,
       receiver: designerId,
       content: customOrderMessage,
       type: 'text',
       status: 'sent'
     });

     // Update conversation's last message and activity
     conversation.lastMessage = customOrderMessage;
     conversation.lastActivity = new Date();
     
     // Update unread count for designer
     const currentUnreadCount = conversation.unreadCount.get(designerId.toString()) || 0;
     conversation.unreadCount.set(designerId.toString(), currentUnreadCount + 1);
     
     await conversation.save();

     console.log('✅ Custom order message sent to designer:', designerId);
   } catch (messageError) {
     console.error('Failed to send custom order message:', messageError.message);
     // Don't fail the order creation if messaging fails
   }
 }

 return res.status(201).json(new ApiResponse(201, order, "Order created successfully"));
});
const getMyOrders = asyncHandler(async (req, res) => {
 const { page = 1, limit = 10, sortBy = 'createdAt', sortType = 'desc' } = req.query;

 const options = {
   page: parseInt(page),
   limit: parseInt(limit),
   sort: { [sortBy]: sortType === 'desc' ? -1 : 1 },
   populate: [
     { path: 'designer', select: 'name businessName' },
     { path: 'items.product', select: 'name images price' }
   ]
 };

 const orders = await Order.paginate({ buyer: req.user._id }, options);
 return res.status(200).json(new ApiResponse(200, orders, "User orders fetched successfully"));
});
const getOrderById = asyncHandler(async (req, res) => {
 const order = await Order.findById(req.params.id)
     .populate('buyer', 'name email')
     .populate('designer', 'name email businessName')
     .populate('items.product', 'name images');
 if (!order) {
     throw new ApiError(404, "Order not found");
 }
 // Check if user is authorized to view this order
 if (order.buyer._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN' && order.designer._id.toString() !== req.user._id.toString()) {
     throw new ApiError(403, "You are not authorized to view this order");
 }
 return res.status(200).json(new ApiResponse(200, order, "Order details fetched successfully"));
});
const updateOrderStatus = asyncHandler(async (req, res) => {
 const { status, notes } = req.body;
 const order = await Order.findById(req.params.id);
 if (!order) {
     throw new ApiError(404, "Order not found");
 }

 // Check if user has permission to update this order
 const userId = req.user._id;
 const userRole = req.user.role;

 if (userRole === 'DESIGNER' && order.designer.toString() !== userId.toString()) {
   throw new ApiError(403, "You can only update your own orders");
 }

 const oldStatus = order.status;
 order.status = status;

 if (status === 'DELIVERED') {
     order.deliveredAt = Date.now();
 }

 if (notes) {
   order.notes = notes;
 }

 await order.save();

 // Send notification to customer about status change
 try {
   await notificationService.notifyCustomerOrderUpdate(order, status);
   console.log('✅ Customer notification sent for order status update:', order._id);
 } catch (notificationError) {
   console.error('Failed to send customer notification:', notificationError.message);
 }

 return res.status(200).json(new ApiResponse(200, order, "Order status updated successfully"));
});

// Get designer orders
const getDesignerOrders = asyncHandler(async (req, res) => {
 const { page = 1, limit = 10, status, sortBy = 'createdAt', sortType = 'desc' } = req.query;
 const designerId = req.user._id;

 const query = { designer: designerId };
 if (status) {
   query.status = status;
 }

 const options = {
   page: parseInt(page),
   limit: parseInt(limit),
   sort: { [sortBy]: sortType === 'desc' ? -1 : 1 },
   populate: [
     { path: 'buyer', select: 'name email phone' },
     { path: 'items.product', select: 'name images price' }
   ]
 };

 const orders = await Order.paginate(query, options);
 return res.status(200).json(new ApiResponse(200, orders, "Designer orders fetched successfully"));
});

// Approve order (designer only)
const approveOrder = asyncHandler(async (req, res) => {
 const { orderId } = req.params;
 const { notes } = req.body;
 const designerId = req.user._id;

 const order = await Order.findOne({ _id: orderId, designer: designerId });
 if (!order) {
   throw new ApiError(404, "Order not found or you don't have permission to approve it");
 }

 if (order.status !== 'PENDING') {
   throw new ApiError(400, "Only pending orders can be approved");
 }

 order.status = 'CONFIRMED';
 if (notes) {
   order.notes = notes;
 }
 await order.save();

 // Send notification to customer
 try {
   await notificationService.notifyCustomerOrderUpdate(order, 'CONFIRMED', notes);
   console.log('✅ Customer notification sent for order approval:', order._id);
 } catch (notificationError) {
   console.error('Failed to send customer notification:', notificationError.message);
 }

 return res.status(200).json(new ApiResponse(200, order, "Order approved successfully"));
});

// Reject order (designer only)
const rejectOrder = asyncHandler(async (req, res) => {
 const { orderId } = req.params;
 const { reason } = req.body;
 const designerId = req.user._id;

 if (!reason) {
   throw new ApiError(400, "Rejection reason is required");
 }

 const order = await Order.findOne({ _id: orderId, designer: designerId });
 if (!order) {
   throw new ApiError(404, "Order not found or you don't have permission to reject it");
 }

 if (order.status !== 'PENDING') {
   throw new ApiError(400, "Only pending orders can be rejected");
 }

 order.status = 'CANCELLED';
 order.notes = reason;
 await order.save();

 // Send notification to customer
 try {
   const message = `Your order has been cancelled by the designer. Reason: ${reason}`;
   await notificationService.notifyCustomerOrderUpdate(order, 'CANCELLED', message);
   console.log('✅ Customer notification sent for order rejection:', order._id);
 } catch (notificationError) {
   console.error('Failed to send customer notification:', notificationError.message);
 }

 return res.status(200).json(new ApiResponse(200, order, "Order rejected successfully"));
});

export {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getDesignerOrders,
  approveOrder,
  rejectOrder
};
