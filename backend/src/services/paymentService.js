import axios from 'axios';
import FormData from 'form-data';
import { ApiError } from '../utils/ApiError.js';

class PaymentService {
  constructor() {
    this.baseURL = 'https://api-sandbox.ctechpay.com/student';
    this.mobileBaseURL = 'https://apisandbox.ctechpay.com/student';
    this.token = process.env.CTECH_TOKEN || '37e4099551760b60719d1c6e305c5090';
    this.registration = process.env.CTECH_REGISTRATION || 'BICT3321';
  }

  /**
   * Create a payment order with Ctech
   * @param {Object} orderData - Order information
   * @param {number} orderData.amount - Amount to be paid
   * @param {string} orderData.redirectUrl - Success redirect URL
   * @param {string} orderData.cancelUrl - Cancel redirect URL
   * @param {string} orderData.cancelText - Cancel button text
   * @returns {Promise<Object>} Payment order response
   */
  async createPaymentOrder(orderData) {
    try {
      const { amount, redirectUrl, cancelUrl, cancelText } = orderData;

      const formData = new FormData();
      formData.append('token', this.token);
      formData.append('registration', this.registration);
      formData.append('amount', amount.toString());
      
      if (redirectUrl) formData.append('redirectUrl', redirectUrl);
      if (cancelUrl) formData.append('cancelUrl', cancelUrl);
      if (cancelText) formData.append('cancelText', cancelText);

      console.log('🔄 Creating Ctech payment order:', {
        registration: this.registration,
        amount,
        redirectUrl,
        cancelUrl
      });

      const response = await axios.post(
        `${this.baseURL}/?endpoint=order`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('✅ Ctech payment order created:', response.data);

      if (!response.data.payment_page_URL) {
        throw new ApiError(400, 'Invalid payment response from gateway');
      }

      return {
        success: true,
        orderReference: response.data.order_reference,
        paymentPageUrl: response.data.payment_page_URL,
        amount: amount,
        status: 'PENDING'
      };

    } catch (error) {
      console.error('❌ Error creating payment order:', error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        throw new ApiError(400, 'Invalid payment parameters');
      } else if (error.response?.status === 401) {
        throw new ApiError(401, 'Invalid payment gateway credentials');
      } else if (error.code === 'ECONNABORTED') {
        throw new ApiError(408, 'Payment gateway timeout');
      }
      
      throw new ApiError(500, 'Payment gateway error');
    }
  }

  /**
   * Process Airtel Money payment
   * @param {Object} paymentData - Mobile payment data
   * @param {number} paymentData.amount - Amount to be paid
   * @param {string} paymentData.phone - Airtel phone number
   * @returns {Promise<Object>} Mobile payment response
   */
  async processAirtelPayment(paymentData) {
    try {
      const { amount, phone } = paymentData;

      // Validate phone number format (should be Malawian Airtel number)
      const phoneRegex = /^(099|088|089)\d{7}$/;
      if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
        throw new ApiError(400, 'Invalid Airtel phone number format');
      }

      const formData = new FormData();
      formData.append('airtel', '1');
      formData.append('token', this.token);
      formData.append('registration', this.registration);
      formData.append('amount', amount.toString());
      formData.append('phone', phone);

      console.log('🔄 Processing Airtel Money payment:', {
        registration: this.registration,
        amount,
        phone: phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3') // Mask middle digits
      });

      const response = await axios.post(
        `${this.baseURL}/mobile/`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Content-Type': 'multipart/form-data'
          },
          timeout: 45000 // 45 second timeout for mobile payments
        }
      );

      console.log('✅ Airtel Money payment initiated:', {
        transId: response.data.trans_id,
        status: response.data.status
      });

      return {
        success: true,
        transactionId: response.data.trans_id,
        status: response.data.status || 'PENDING',
        message: response.data.message || 'Payment initiated',
        amount: amount,
        phone: phone
      };

    } catch (error) {
      console.error('❌ Error processing Airtel payment:', error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        throw new ApiError(400, error.response.data?.message || 'Invalid mobile payment parameters');
      } else if (error.response?.status === 401) {
        throw new ApiError(401, 'Invalid payment gateway credentials');
      } else if (error.code === 'ECONNABORTED') {
        throw new ApiError(408, 'Mobile payment timeout');
      }
      
      throw new ApiError(500, 'Mobile payment gateway error');
    }
  }

  /**
   * Check card payment status
   * @param {string} orderReference - Order reference from payment creation
   * @returns {Promise<Object>} Payment status
   */
  async checkCardPaymentStatus(orderReference) {
    try {
      const formData = new FormData();
      formData.append('token', this.token);
      formData.append('registration', this.registration);
      formData.append('orderRef', orderReference);

      console.log('🔄 Checking card payment status:', { orderReference });

      const response = await axios.post(
        `${this.baseURL}/status/`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Content-Type': 'multipart/form-data'
          },
          timeout: 15000
        }
      );

      console.log('✅ Card payment status checked:', response.data);

      return {
        success: true,
        status: response.data.status,
        amount: response.data.amount,
        orderReference: response.data.orderReference || orderReference,
        transactionId: response.data.transactionId,
        message: response.data.message
      };

    } catch (error) {
      console.error('❌ Error checking card payment status:', error.response?.data || error.message);
      throw new ApiError(500, 'Failed to check payment status');
    }
  }

  /**
   * Check mobile payment status
   * @param {string} transactionId - Transaction ID from mobile payment
   * @returns {Promise<Object>} Mobile payment status
   */
  async checkMobilePaymentStatus(transactionId) {
    try {
      console.log('🔄 Checking mobile payment status:', { transactionId });

      const response = await axios.get(
        `${this.mobileBaseURL}/mobile/status/?trans_id=${transactionId}`,
        {
          timeout: 15000
        }
      );

      console.log('✅ Mobile payment status checked:', response.data);

      return {
        success: true,
        status: response.data.status,
        amount: response.data.amount,
        transactionId: transactionId,
        message: response.data.message
      };

    } catch (error) {
      console.error('❌ Error checking mobile payment status:', error.response?.data || error.message);
      throw new ApiError(500, 'Failed to check mobile payment status');
    }
  }

  /**
   * Validate payment amount
   * @param {number} amount - Amount to validate
   * @returns {boolean} Is valid amount
   */
  validateAmount(amount) {
    return typeof amount === 'number' && amount > 0 && amount <= 10000000; // Max 10M MWK
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount in tambala
   * @returns {string} Formatted amount
   */
  formatAmount(amount) {
    return `MWK ${(amount / 100).toLocaleString('en-MW', { minimumFractionDigits: 2 })}`;
  }

  /**
   * Get payment method info
   * @param {string} method - Payment method ('card' or 'airtel')
   * @returns {Object} Payment method information
   */
  getPaymentMethodInfo(method) {
    const methods = {
      card: {
        name: 'Card Payment',
        description: 'Pay with Visa, Mastercard, or other supported cards',
        icon: 'credit-card',
        processingTime: '1-2 minutes'
      },
      airtel: {
        name: 'Airtel Money',
        description: 'Pay with your Airtel Money account',
        icon: 'smartphone',
        processingTime: '2-5 minutes'
      }
    };

    return methods[method] || null;
  }
}

export default new PaymentService();
