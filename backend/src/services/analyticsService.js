import { DailyAnalytics, MonthlyAnalytics, ProductAnalytics, UserAnalytics, Invoice } from '../models/analytics.model.js';
import { Order } from '../models/order.model.js';

class AnalyticsService {
  // Update daily analytics when an order is placed
  async updateOrderAnalytics(order) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Update daily analytics
      await DailyAnalytics.findOneAndUpdate(
        { date: today },
        {
          $inc: {
            'orders.total': 1,
            [`orders.${order.status.toLowerCase()}`]: 1,
            'revenue.total': order.totalAmount,
            [`revenue.byPaymentMethod.${order.paymentMethod}`]: order.totalAmount
          }
        },
        { upsert: true, new: true }
      );

      // Update monthly analytics
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      await MonthlyAnalytics.findOneAndUpdate(
        { year, month },
        {
          $inc: {
            'orders.total': 1,
            'orders.revenue': order.totalAmount
          }
        },
        { upsert: true, new: true }
      );

      // Update product analytics for each item
      for (const item of order.items) {
        await ProductAnalytics.findOneAndUpdate(
          { product: item.product, date: today },
          {
            $inc: {
              sales: item.quantity,
              revenue: item.price * item.quantity
            }
          },
          { upsert: true, new: true }
        );
      }

      // Update user analytics
      await UserAnalytics.findOneAndUpdate(
        { user: order.user, date: today },
        {
          $inc: {
            ordersPlaced: 1,
            totalSpent: order.totalAmount
          }
        },
        { upsert: true, new: true }
      );

      console.log('📊 Analytics updated for order:', order._id);
    } catch (error) {
      console.error('Error updating order analytics:', error);
    }
  }

  // Update analytics when order status changes
  async updateOrderStatusAnalytics(orderId, oldStatus, newStatus) {
    try {
      const order = await Order.findById(orderId);
      if (!order) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Update daily analytics - decrement old status, increment new status
      const updateQuery = {
        $inc: {}
      };

      if (oldStatus) {
        updateQuery.$inc[`orders.${oldStatus.toLowerCase()}`] = -1;
      }
      updateQuery.$inc[`orders.${newStatus.toLowerCase()}`] = 1;

      await DailyAnalytics.findOneAndUpdate(
        { date: today },
        updateQuery,
        { upsert: true, new: true }
      );

      console.log('📊 Order status analytics updated:', orderId, oldStatus, '->', newStatus);
    } catch (error) {
      console.error('Error updating order status analytics:', error);
    }
  }

  // Track product view
  async trackProductView(productId, userId = null) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Update product analytics
      await ProductAnalytics.findOneAndUpdate(
        { product: productId, date: today },
        { $inc: { views: 1 } },
        { upsert: true, new: true }
      );

      // Update user analytics if user is logged in
      if (userId) {
        await UserAnalytics.findOneAndUpdate(
          { user: userId, date: today },
          {
            $inc: { pageViews: 1 },
            $addToSet: { productsViewed: productId }
          },
          { upsert: true, new: true }
        );
      }
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }

  // Track add to cart
  async trackAddToCart(productId, userId = null) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await ProductAnalytics.findOneAndUpdate(
        { product: productId, date: today },
        { $inc: { addToCartCount: 1 } },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error tracking add to cart:', error);
    }
  }

  // Get dashboard analytics
  async getDashboardAnalytics(days = 30) {
    try {
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // Get daily analytics for the period
      const dailyData = await DailyAnalytics.find({
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });

      // Calculate totals
      const totals = dailyData.reduce((acc, day) => {
        acc.orders += day.orders.total;
        acc.revenue += day.revenue.total;
        acc.newUsers += day.users.newRegistrations;
        return acc;
      }, { orders: 0, revenue: 0, newUsers: 0 });

      // Get recent orders
      const recentOrders = await Order.find()
        .populate('user', 'name email')
        .populate('designer', 'name')
        .sort({ createdAt: -1 })
        .limit(10);

      // Get top products
      const topProducts = await ProductAnalytics.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$product',
            totalSales: { $sum: '$sales' },
            totalRevenue: { $sum: '$revenue' },
            totalViews: { $sum: '$views' }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $sort: { totalRevenue: -1 }
        },
        {
          $limit: 5
        }
      ]);

      return {
        totals,
        dailyData,
        recentOrders,
        topProducts
      };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw error;
    }
  }

  // Create invoice for order
  async createInvoice(orderId) {
    try {
      const order = await Order.findById(orderId)
        .populate('buyer')
        .populate('designer')
        .populate('items.product');

      if (!order) {
        throw new Error('Order not found');
      }

      // Check if invoice already exists
      const existingInvoice = await Invoice.findOne({ order: orderId });
      if (existingInvoice) {
        return existingInvoice;
      }

      // Calculate totals
      const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shippingCost = order.shippingCost || 0;
      const tax = 0; // No tax for now
      const totalAmount = subtotal + shippingCost + tax;

      // Create invoice
      const invoice = new Invoice({
        order: orderId,
        user: order.buyer._id,
        designer: order.designer._id,
        items: order.items.map(item => ({
          product: item.product._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal,
        shippingCost,
        tax,
        totalAmount,
        billingAddress: {
          name: order.buyer.name,
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          country: order.shippingAddress.country,
          zipCode: order.shippingAddress.zipCode,
          phone: order.shippingAddress.phone,
          email: order.buyer.email
        },
        status: order.paymentStatus === 'Paid' ? 'PAID' : 'SENT'
      });

      await invoice.save();
      console.log('📄 Invoice created:', invoice.invoiceNumber);
      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
