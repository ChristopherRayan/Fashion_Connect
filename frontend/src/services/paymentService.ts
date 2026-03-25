import { httpClient } from './httpClient';
import { API_ENDPOINTS } from '../config/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  processingTime: string;
  enabled: boolean;
}

export interface PaymentOrder {
  orderId: string;
  paymentReference: string;
  paymentPageUrl: string;
  amount: number;
  paymentMethod: string;
  status: string;
}

export interface MobilePayment {
  orderId: string;
  transactionId: string;
  status: string;
  message: string;
  amount: number;
  phone: string;
}

export interface PaymentStatus {
  orderId: string;
  paymentStatus: string;
  paymentMethod: string;
  amount: number;
  reference: string;
  message?: string;
}

export interface PaymentHistory {
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference: string;
  paymentInitiatedAt: string;
  paidAt?: string;
  designer: {
    _id: string;
    name: string;
    businessName?: string;
  };
  itemCount: number;
  items: Array<{
    product: {
      _id: string;
      name: string;
      images: string[];
      price: number;
    };
    quantity: number;
    price: number;
  }>;
}

export interface PaymentHistoryResponse {
  payments: PaymentHistory[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPayments: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class PaymentService {
  constructor() {
    // Using singleton httpClient instance
  }

  private extractData<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'API request failed');
    }
    return response.data;
  }

  // Get available payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await httpClient.get<ApiResponse<PaymentMethod[]>>(
        `${API_ENDPOINTS.PAYMENTS.BASE}/methods`,
        false // No authentication required
      );
      return this.extractData(response);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      throw error;
    }
  }

  // Create payment order for card payment
  async createPaymentOrder(orderData: {
    orderId: string;
    paymentMethod: string;
    amount: number;
    redirectUrl?: string;
    cancelUrl?: string;
  }): Promise<PaymentOrder> {
    try {
      const response = await httpClient.post<ApiResponse<PaymentOrder>>(
        `${API_ENDPOINTS.PAYMENTS.BASE}/create-order`,
        orderData,
        true // Requires authentication
      );
      return this.extractData(response);
    } catch (error) {
      console.error('Failed to create payment order:', error);
      throw error;
    }
  }

  // Process mobile payment (Airtel Money)
  async processMobilePayment(paymentData: {
    orderId: string;
    phone: string;
    amount: number;
  }): Promise<MobilePayment> {
    try {
      const response = await httpClient.post<ApiResponse<MobilePayment>>(
        `${API_ENDPOINTS.PAYMENTS.BASE}/mobile-payment`,
        paymentData,
        true // Requires authentication
      );
      return this.extractData(response);
    } catch (error) {
      console.error('Failed to process mobile payment:', error);
      throw error;
    }
  }

  // Check payment status
  async checkPaymentStatus(orderId: string): Promise<PaymentStatus> {
    try {
      const response = await httpClient.get<ApiResponse<PaymentStatus>>(
        `${API_ENDPOINTS.PAYMENTS.BASE}/status/${orderId}`,
        true // Requires authentication
      );
      return this.extractData(response);
    } catch (error) {
      console.error('Failed to check payment status:', error);
      throw error;
    }
  }

  // Get payment history
  async getPaymentHistory(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<PaymentHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const url = `${API_ENDPOINTS.PAYMENTS.BASE}/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await httpClient.get<ApiResponse<PaymentHistoryResponse>>(
        url,
        true // Requires authentication
      );
      return this.extractData(response);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      throw error;
    }
  }

  // Format amount for display
  formatAmount(amount: number): string {
    return `MWK ${(amount / 100).toLocaleString('en-MW', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  }

  // Validate phone number for Airtel Money
  validateAirtelPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\s+/g, '');
    const phoneRegex = /^(099|088|089)\d{7}$/;
    return phoneRegex.test(cleanPhone);
  }

  // Format phone number for display
  formatPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    return phone;
  }

  // Get payment status color for UI
  getPaymentStatusColor(status: string): string {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
      case 'PURCHASED':
        return 'text-green-600';
      case 'PENDING':
        return 'text-yellow-600';
      case 'FAILED':
      case 'CANCELLED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  // Get payment status badge color for UI
  getPaymentStatusBadgeColor(status: string): string {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
      case 'PURCHASED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Get payment method icon
  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'card':
        return 'credit-card';
      case 'airtel':
        return 'smartphone';
      case 'cash_on_delivery':
        return 'banknote';
      default:
        return 'payment';
    }
  }

  // Open payment page in new window
  openPaymentPage(paymentPageUrl: string): Window | null {
    const paymentWindow = window.open(
      paymentPageUrl,
      'payment',
      'width=800,height=600,scrollbars=yes,resizable=yes'
    );

    if (!paymentWindow) {
      throw new Error('Failed to open payment window. Please allow popups for this site.');
    }

    return paymentWindow;
  }

  // Poll payment status with intervals
  async pollPaymentStatus(
    orderId: string, 
    onStatusUpdate: (status: PaymentStatus) => void,
    maxAttempts: number = 30,
    interval: number = 5000
  ): Promise<void> {
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const status = await this.checkPaymentStatus(orderId);
        onStatusUpdate(status);

        // Stop polling if payment is completed or failed
        if (['PAID', 'COMPLETED', 'PURCHASED', 'FAILED', 'CANCELLED'].includes(status.paymentStatus.toUpperCase())) {
          return;
        }

        // Continue polling if not max attempts reached
        if (attempts < maxAttempts) {
          setTimeout(poll, interval);
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, interval);
        }
      }
    };

    poll();
  }
}

export const paymentService = new PaymentService();
