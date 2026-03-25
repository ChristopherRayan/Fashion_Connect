import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import { Order } from '../../models/order.model.js';
import { Invoice } from '../../models/analytics.model.js';
import { Message } from '../../models/message.model.js';
import { Notification } from '../../models/notification.model.js';
import { Review } from '../../models/review.model.js';
import mongoose from 'mongoose';

// Get database overview
const getDatabaseOverview = asyncHandler(async (req, res) => {
  try {
    // Get collection stats
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Get counts for each collection
    const stats = {
      database: {
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        totalCollections: collections.length
      },
      collections: collections.map(col => col.name),
      counts: {
        users: await User.countDocuments(),
        products: await Product.countDocuments(),
        orders: await Order.countDocuments(),
        invoices: await Invoice.countDocuments(),
        messages: await Message.countDocuments(),
        notifications: await Notification.countDocuments(),
        reviews: await Review.countDocuments()
      }
    };

    return res.status(200).json(new ApiResponse(200, stats, "Database overview retrieved successfully"));
  } catch (error) {
    console.error('Error getting database overview:', error);
    return res.status(500).json(new ApiResponse(500, null, "Failed to get database overview"));
  }
});

// Get users data
const getUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email role status verified createdAt lastLogin')
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, users, "Users retrieved successfully"));
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json(new ApiResponse(500, null, "Failed to get users"));
  }
});

// Get products data
const getProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({})
      .select('name price category images featured createdAt')
      .populate('designer', 'name businessName status')
      .sort({ createdAt: -1 });

    // Filter out products from deactivated or suspended designers
    const activeProducts = products.filter(product =>
      !product.designer || !['DEACTIVATED', 'SUSPENDED'].includes(product.designer.status)
    );

    return res.status(200).json(new ApiResponse(200, activeProducts, "Products retrieved successfully"));
  } catch (error) {
    console.error('Error getting products:', error);
    return res.status(500).json(new ApiResponse(500, null, "Failed to get products"));
  }
});

// Get orders data
const getOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find({})
      .select('totalAmount status createdAt isCustomOrder paymentStatus')
      .populate('user', 'name email')
      .populate('designer', 'name businessName')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, orders, "Orders retrieved successfully"));
  } catch (error) {
    console.error('Error getting orders:', error);
    return res.status(500).json(new ApiResponse(500, null, "Failed to get orders"));
  }
});

// Get invoices data
const getInvoices = asyncHandler(async (req, res) => {
  try {
    const invoices = await Invoice.find({})
      .select('invoiceNumber totalAmount status issueDate')
      .populate('user', 'name email')
      .populate('designer', 'name businessName')
      .populate('order', 'totalAmount status')
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, invoices, "Invoices retrieved successfully"));
  } catch (error) {
    console.error('Error getting invoices:', error);
    return res.status(500).json(new ApiResponse(500, null, "Failed to get invoices"));
  }
});

// Get messages data
const getMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({})
      .select('content type createdAt')
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to recent 50 messages

    return res.status(200).json(new ApiResponse(200, messages, "Messages retrieved successfully"));
  } catch (error) {
    console.error('Error getting messages:', error);
    return res.status(500).json(new ApiResponse(500, null, "Failed to get messages"));
  }
});

// Get notifications data
const getNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .select('title message type priority read createdAt')
      .populate('recipient', 'name')
      .populate('sender', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, notifications, "Notifications retrieved successfully"));
  } catch (error) {
    console.error('Error getting notifications:', error);
    return res.status(500).json(new ApiResponse(500, null, "Failed to get notifications"));
  }
});

// Get reviews data
const getReviews = asyncHandler(async (req, res) => {
  try {
    const reviews = await Review.find({})
      .select('rating title comment verified createdAt')
      .populate('user', 'name')
      .populate('product', 'name')
      .populate('designer', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, reviews, "Reviews retrieved successfully"));
  } catch (error) {
    console.error('Error getting reviews:', error);
    return res.status(500).json(new ApiResponse(500, null, "Failed to get reviews"));
  }
});

export {
  getDatabaseOverview,
  getUsers,
  getProducts,
  getOrders,
  getInvoices,
  getMessages,
  getNotifications,
  getReviews
};
