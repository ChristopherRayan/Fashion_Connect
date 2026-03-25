import { BaseService, PaginatedResponse, SearchParams } from './baseService';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';
import { ApiResponse } from './httpClient';

// Order types
export interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
  price: number;
  color?: string;
  size?: string;
  customizations?: Record<string, any>;
  deliveryInfo?: {
    type: string;
    days: number;
    price: number;
    description: string;
  };
}

export interface Order {
  _id: string;
  buyer?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  designer: {
    _id: string;
    name: string;
    email?: string;
    businessName?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY_FOR_SHIPPING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    zipCode?: string;
    phone?: string;
  };
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string;
  paymentPhone?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  isCustomOrder: boolean;
  customDetails?: {
    measurements?: any;
    designNotes?: string;
    referenceImages?: string[];
    deadline?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Order request types
export interface CreateOrderRequest {
  items: Array<{
    product: string;
    name: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
    image?: string;
    customizations?: Record<string, any>;
    deliveryInfo?: {
      type: string;
      days: number;
      price: number;
      description: string;
    };
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  paymentMethod: string;
  notes?: string;
  isCustomOrder?: boolean;
  customDetails?: Record<string, any>;
}

export interface UpdateOrderStatusRequest {
  status: Order['status'];
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
}

// Order query parameters
export interface OrderSearchParams extends SearchParams {
  status?: Order['status'];
  paymentStatus?: Order['paymentStatus'];
  isCustomOrder?: boolean;
  designer?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Order Service
class OrderService extends BaseService {
  // Create new order
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      console.log('🛒 OrderService: Creating order with data:', {
        itemsCount: orderData.items.length,
        totalAmount: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        paymentMethod: orderData.paymentMethod,
        isCustomOrder: orderData.isCustomOrder,
        shippingAddress: orderData.shippingAddress
      });

      const response = await this.httpClient.post<ApiResponse<Order>>(
        API_ENDPOINTS.ORDERS.CREATE,
        orderData,
        true // Requires authentication
      );

      console.log('✅ OrderService: Order created successfully:', response);
      return this.extractData(response);
    } catch (error) {
      console.error('❌ OrderService: Order creation failed:', error);
      this.handleError(error);
    }
  }

  // Get current user's orders
  async getMyOrders(params: OrderSearchParams = {}): Promise<PaginatedResponse<Order>> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<ApiResponse<PaginatedResponse<Order>>>(
        `${API_ENDPOINTS.ORDERS.MY_ORDERS}${queryString}`,
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await this.httpClient.get<ApiResponse<Order>>(
        API_ENDPOINTS.ORDERS.DETAIL(orderId),
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update order status (for designers/admin)
  async updateOrderStatus(orderId: string, statusData: UpdateOrderStatusRequest | { status: Order['status']; notes?: string }): Promise<Order> {
    try {
      const response = await this.httpClient.patch<ApiResponse<Order>>(
        API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId),
        statusData,
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      console.error('Failed to update order status:', error);
      this.handleError(error);
    }
  }

  // Get recent orders (helper method)
  async getRecentOrders(limit = 5): Promise<Order[]> {
    try {
      const response = await this.getMyOrders({ 
        limit,
        page: 1,
        sortBy: 'createdAt',
        sortType: 'desc'
      });
      
      return response.docs;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get orders by status
  async getOrdersByStatus(status: Order['status'], params: SearchParams = {}): Promise<PaginatedResponse<Order>> {
    try {
      return await this.getMyOrders({ ...params, status });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get custom orders
  async getCustomOrders(params: SearchParams = {}): Promise<PaginatedResponse<Order>> {
    try {
      return await this.getMyOrders({ ...params, isCustomOrder: true });
    } catch (error) {
      this.handleError(error);
    }
  }



  // Cancel order
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    try {
      return await this.updateOrderStatus(orderId, {
        status: 'CANCELLED',
        notes: reason
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Calculate order total (helper method)
  calculateOrderTotal(items: CreateOrderRequest['items'], products: Array<{ _id: string; price: number }>): number {
    return items.reduce((total, item) => {
      const product = products.find(p => p._id === item.product);
      if (product) {
        return total + (product.price * item.quantity);
      }
      return total;
    }, 0);
  }

  // Get designer's orders
  async getDesignerOrders(params: OrderSearchParams = {}): Promise<PaginatedResponse<Order>> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<ApiResponse<PaginatedResponse<Order>>>(
        `${API_ENDPOINTS.ORDERS.DESIGNER_ORDERS}${queryString}`,
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      console.error('Failed to fetch designer orders:', error);
      // Return empty response as fallback
      return {
        docs: [],
        totalDocs: 0,
        limit: params.limit || 10,
        page: params.page || 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null
      };
    }
  }

  // Get order status display text
  getStatusDisplayText(status: Order['status']): string {
    const statusMap: Record<Order['status'], string> = {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      PROCESSING: 'Processing',
      READY_FOR_SHIPPING: 'Ready for Shipping',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled'
    };

    return statusMap[status] || status;
  }

  // Get order status color for UI
  getStatusColor(status: Order['status']): string {
    const colorMap: Record<Order['status'], string> = {
      PENDING: 'yellow',
      CONFIRMED: 'blue',
      PROCESSING: 'purple',
      READY_FOR_SHIPPING: 'orange',
      SHIPPED: 'indigo',
      DELIVERED: 'green',
      CANCELLED: 'red'
    };

    return colorMap[status] || 'gray';
  }

  // Approve order (designer only)
  async approveOrder(orderId: string, notes?: string): Promise<Order> {
    try {
      const response = await this.httpClient.patch<ApiResponse<Order>>(
        API_ENDPOINTS.ORDERS.APPROVE(orderId),
        { notes },
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Reject order (designer only)
  async rejectOrder(orderId: string, reason: string): Promise<Order> {
    try {
      const response = await this.httpClient.patch<ApiResponse<Order>>(
        `/orders/${orderId}/reject`,
        { reason },
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get order analytics for designer
  async getOrderAnalytics(params: {
    startDate?: string;
    endDate?: string;
    period?: 'week' | 'month' | 'year'
  } = {}): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
    revenueByMonth: Array<{ month: string; revenue: number }>;
    topProducts: Array<{ productId: string; productName: string; orders: number; revenue: number }>;
  }> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<ApiResponse<{
        totalOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
        ordersByStatus: Record<string, number>;
        revenueByMonth: Array<{ month: string; revenue: number }>;
        topProducts: Array<{ productId: string; productName: string; orders: number; revenue: number }>;
      }>>(
        `/orders/designer-analytics${queryString}`,
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      console.error('Failed to fetch order analytics:', error);
      // Return default analytics structure
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        ordersByStatus: {},
        revenueByMonth: [],
        topProducts: []
      };
    }
  }

  // Get order summary stats
  async getOrderSummary(): Promise<{
    todayOrders: number;
    weekOrders: number;
    monthOrders: number;
    pendingOrders: number;
    processingOrders: number;
    completedOrders: number;
  }> {
    try {
      const response = await this.httpClient.get<ApiResponse<{
        todayOrders: number;
        weekOrders: number;
        monthOrders: number;
        pendingOrders: number;
        processingOrders: number;
        completedOrders: number;
      }>>(
        '/orders/designer-summary',
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      console.error('Failed to fetch order summary:', error);
      return {
        todayOrders: 0,
        weekOrders: 0,
        monthOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        completedOrders: 0
      };
    }
  }

  // Generate invoice for order
  async generateInvoice(orderId: string, format: 'pdf' | 'html' = 'pdf'): Promise<Blob> {
    // Skip server-side generation and go directly to client-side generation
    // This avoids all ad blocker issues and provides immediate results
    console.log('Generating client-side invoice for order:', orderId);
    return this.generateFallbackInvoice(orderId, format);
  }

  // Alternative method to try server-side generation (can be called separately if needed)
  async generateServerInvoice(orderId: string, format: 'pdf' | 'html' = 'pdf'): Promise<Blob> {
    const endpoints = [
      // Try receipt endpoint first (less likely to be blocked)
      () => fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ORDERS.DOWNLOAD_RECEIPT(orderId)}?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Accept': 'application/pdf, application/octet-stream',
        },
      }),
      // Try order-based invoice endpoint
      () => fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ORDERS.DOWNLOAD_INVOICE(orderId)}?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Accept': 'application/pdf, application/octet-stream',
        },
      }),
      // Try analytics endpoint as last resort
      async () => {
        const createResponse = await this.httpClient.post<ApiResponse<any>>(
          API_ENDPOINTS.ANALYTICS.CREATE_INVOICE(orderId),
          {},
          true
        );
        const invoice = this.extractData(createResponse);

        return fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ANALYTICS.DOWNLOAD_INVOICE(invoice._id)}?format=${format}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/pdf, application/octet-stream',
          },
        });
      }
    ];

    for (let i = 0; i < endpoints.length; i++) {
      try {
        console.log(`Trying server endpoint ${i + 1}/${endpoints.length}...`);
        const response = await endpoints[i]();

        if (response.ok) {
          return await response.blob();
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (error) {
        console.error(`Server endpoint ${i + 1} failed:`, error);

        if (i === endpoints.length - 1) {
          // All server endpoints failed, use client-side generation
          console.log('All server endpoints failed, using client-side generation');
          return this.generateFallbackInvoice(orderId, format);
        }
      }
    }

    // This should never be reached, but just in case
    return this.generateFallbackInvoice(orderId, format);
  }

  // Generate fallback invoice when API fails
  private async generateFallbackInvoice(orderId: string, format: 'pdf' | 'html' = 'pdf'): Promise<Blob> {
    try {
      // Get order details
      const order = await this.getOrderById(orderId);
      const customer = order.buyer || order.user || (order as any).customer;

      // Use PDF generator for PDF format
      if (format === 'pdf') {
        const { pdfInvoiceGenerator } = await import('../utils/pdfInvoiceGenerator');
        return await pdfInvoiceGenerator.generateInvoicePDF(order);
      }

      // Create HTML invoice
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice - Order #${order._id.slice(-8)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f1c40f; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #333; }
            .logo .fashion { color: #f1c40f; text-shadow: 1px 1px 0px #000; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-info, .order-info { width: 45%; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .items-table th { background-color: #f8f9fa; font-weight: bold; }
            .total-section { text-align: right; margin-top: 20px; }
            .total-row { font-size: 18px; font-weight: bold; color: #f1c40f; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <span class="fashion">FASHION</span><span>CONNECT</span>
            </div>
            <h2>INVOICE</h2>
          </div>

          <div class="invoice-details">
            <div class="customer-info">
              <h3>Bill To:</h3>
              <p><strong>${customer?.name || 'N/A'}</strong></p>
              <p>${customer?.email || 'N/A'}</p>
              ${order.shippingAddress ? `
                <p>${order.shippingAddress.street}</p>
                <p>${order.shippingAddress.city}, ${order.shippingAddress.country}</p>
                ${order.shippingAddress.phone ? `<p>Phone: ${order.shippingAddress.phone}</p>` : ''}
              ` : ''}
            </div>

            <div class="order-info">
              <h3>Invoice Details:</h3>
              <p><strong>Invoice #:</strong> INV-${order._id.slice(-8)}</p>
              <p><strong>Order #:</strong> ${order._id.slice(-8)}</p>
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
              ${order.designer ? `<p><strong>Designer:</strong> ${order.designer.name || order.designer.businessName}</p>` : ''}
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    <strong>${item.product?.name || 'Product'}</strong>
                    ${item.color ? `<br><small>Color: ${item.color}</small>` : ''}
                    ${item.size ? `<br><small>Size: ${item.size}</small>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td>MWK ${item.price.toLocaleString()}</td>
                  <td>MWK ${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <strong>Total Amount: MWK ${order.totalAmount.toLocaleString()}</strong>
            </div>
            <p>Payment Method: ${order.paymentMethod || 'N/A'}</p>
            <p>Payment Status: ${order.paymentStatus || 'Pending'}</p>
          </div>

          <div class="footer">
            <p>Thank you for shopping with FashionConnect!</p>
            <p>This is a computer-generated invoice.</p>
          </div>
        </body>
        </html>
      `;

      // Convert HTML to Blob
      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      return blob;
    } catch (error) {
      console.error('Failed to generate fallback invoice:', error);
      throw new Error('Unable to generate invoice');
    }
  }
}

// Export singleton instance
export const orderService = new OrderService();
