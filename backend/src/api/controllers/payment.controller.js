import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import paymentService from '../../services/paymentService.js';
import { Order } from '../../models/order.model.js';
import { User } from '../../models/user.model.js';

// Create payment order
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod, amount, redirectUrl, cancelUrl } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!orderId || !paymentMethod || !amount) {
    throw new ApiError(400, 'Order ID, payment method, and amount are required');
  }

  // Validate amount
  if (!paymentService.validateAmount(amount)) {
    throw new ApiError(400, 'Invalid payment amount');
  }

  // Validate payment method
  if (!['card', 'airtel'].includes(paymentMethod)) {
    throw new ApiError(400, 'Invalid payment method. Use "card" or "airtel"');
  }

  try {
    // Find the order
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Verify order belongs to user
    if (order.buyer.toString() !== userId.toString()) {
      throw new ApiError(403, 'Unauthorized to pay for this order');
    }

    // Check if order is already paid
    if (order.paymentStatus === 'PAID') {
      throw new ApiError(400, 'Order is already paid');
    }

    // Verify amount matches order total
    if (Math.abs(order.totalAmount - amount) > 1) { // Allow 1 tambala difference for rounding
      throw new ApiError(400, 'Payment amount does not match order total');
    }

    // Create payment order with Ctech
    const paymentOrder = await paymentService.createPaymentOrder({
      amount,
      redirectUrl: redirectUrl || `${process.env.FRONTEND_URL}/client/orders/${orderId}/payment-success`,
      cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/client/orders/${orderId}/payment-cancelled`,
      cancelText: 'Cancel Payment'
    });

    // Update order with payment information
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentMethod,
        paymentStatus: 'PENDING',
        paymentReference: paymentOrder.orderReference,
        paymentInitiatedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log(`💳 Payment order created for order ${orderId}:`, {
      paymentMethod,
      amount: paymentService.formatAmount(amount),
      orderReference: paymentOrder.orderReference
    });

    return res.status(200).json(
      new ApiResponse(200, {
        orderId,
        paymentReference: paymentOrder.orderReference,
        paymentPageUrl: paymentOrder.paymentPageUrl,
        amount,
        paymentMethod,
        status: 'PENDING'
      }, 'Payment order created successfully')
    );

  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
});

// Process mobile payment (Airtel Money)
const processMobilePayment = asyncHandler(async (req, res) => {
  const { orderId, phone, amount } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!orderId || !phone || !amount) {
    throw new ApiError(400, 'Order ID, phone number, and amount are required');
  }

  // Validate amount
  if (!paymentService.validateAmount(amount)) {
    throw new ApiError(400, 'Invalid payment amount');
  }

  try {
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Verify order belongs to user
    if (order.buyer.toString() !== userId.toString()) {
      throw new ApiError(403, 'Unauthorized to pay for this order');
    }

    // Check if order is already paid
    if (order.paymentStatus === 'PAID') {
      throw new ApiError(400, 'Order is already paid');
    }

    // Verify amount matches order total
    if (Math.abs(order.totalAmount - amount) > 1) {
      throw new ApiError(400, 'Payment amount does not match order total');
    }

    // Process Airtel Money payment
    const mobilePayment = await paymentService.processAirtelPayment({
      amount,
      phone
    });

    // Update order with mobile payment information
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentMethod: 'airtel',
        paymentStatus: 'PENDING',
        paymentReference: mobilePayment.transactionId,
        paymentPhone: phone,
        paymentInitiatedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log(`📱 Mobile payment initiated for order ${orderId}:`, {
      transactionId: mobilePayment.transactionId,
      amount: paymentService.formatAmount(amount),
      phone: phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3')
    });

    return res.status(200).json(
      new ApiResponse(200, {
        orderId,
        transactionId: mobilePayment.transactionId,
        status: mobilePayment.status,
        message: mobilePayment.message,
        amount,
        phone
      }, 'Mobile payment initiated successfully')
    );

  } catch (error) {
    console.error('Error processing mobile payment:', error);
    throw error;
  }
});

// Check payment status
const checkPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  try {
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Verify order belongs to user
    if (order.buyer.toString() !== userId.toString()) {
      throw new ApiError(403, 'Unauthorized to check payment status for this order');
    }

    if (!order.paymentReference) {
      throw new ApiError(400, 'No payment reference found for this order');
    }

    let paymentStatus;

    // Check payment status based on payment method
    if (order.paymentMethod === 'airtel') {
      paymentStatus = await paymentService.checkMobilePaymentStatus(order.paymentReference);
    } else {
      paymentStatus = await paymentService.checkCardPaymentStatus(order.paymentReference);
    }

    // Update order status if payment is successful
    if (paymentStatus.status === 'PURCHASED' || paymentStatus.status === 'COMPLETED') {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        status: 'CONFIRMED',
        updatedAt: new Date()
      });

      console.log(`✅ Payment confirmed for order ${orderId}:`, {
        paymentMethod: order.paymentMethod,
        amount: paymentService.formatAmount(paymentStatus.amount || order.totalAmount),
        reference: order.paymentReference
      });
    }

    return res.status(200).json(
      new ApiResponse(200, {
        orderId,
        paymentStatus: paymentStatus.status,
        paymentMethod: order.paymentMethod,
        amount: paymentStatus.amount || order.totalAmount,
        reference: order.paymentReference,
        message: paymentStatus.message
      }, 'Payment status retrieved successfully')
    );

  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
});

// Get payment methods
const getPaymentMethods = asyncHandler(async (req, res) => {
  const paymentMethods = [
    {
      id: 'card',
      ...paymentService.getPaymentMethodInfo('card'),
      enabled: true
    },
    {
      id: 'airtel',
      ...paymentService.getPaymentMethodInfo('airtel'),
      enabled: true
    }
  ];

  return res.status(200).json(
    new ApiResponse(200, paymentMethods, 'Payment methods retrieved successfully')
  );
});

// Handle payment webhook (for future use)
const handlePaymentWebhook = asyncHandler(async (req, res) => {
  // This endpoint can be used for payment gateway webhooks
  // to automatically update payment status
  console.log('Payment webhook received:', req.body);
  
  return res.status(200).json(
    new ApiResponse(200, {}, 'Webhook received')
  );
});

// Get payment history for user
const getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  try {
    const orders = await Order.find({
      buyer: userId,
      paymentStatus: { $in: ['PAID', 'PENDING', 'FAILED'] }
    })
    .populate('items.product', 'name images price')
    .populate('designer', 'name businessName')
    .sort({ paymentInitiatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const totalOrders = await Order.countDocuments({
      buyer: userId,
      paymentStatus: { $in: ['PAID', 'PENDING', 'FAILED'] }
    });

    const paymentHistory = orders.map(order => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentReference: order.paymentReference,
      paymentInitiatedAt: order.paymentInitiatedAt,
      paidAt: order.paidAt,
      designer: order.designer,
      itemCount: order.items.length,
      items: order.items.slice(0, 3) // Show first 3 items
    }));

    return res.status(200).json(
      new ApiResponse(200, {
        payments: paymentHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalPayments: totalOrders,
          hasNext: page * limit < totalOrders,
          hasPrev: page > 1
        }
      }, 'Payment history retrieved successfully')
    );

  } catch (error) {
    console.error('Error getting payment history:', error);
    throw error;
  }
});

export {
  createPaymentOrder,
  processMobilePayment,
  checkPaymentStatus,
  getPaymentMethods,
  handlePaymentWebhook,
  getPaymentHistory
};
