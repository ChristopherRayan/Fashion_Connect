import { BaseService } from './baseService';
import { API_ENDPOINTS } from '../config/api';

// Analytics types
export interface DashboardAnalytics {
  totals: {
    orders: number;
    revenue: number;
    newUsers: number;
  };
  dailyData: DailyAnalytics[];
  recentOrders: Order[];
  topProducts: TopProduct[];
}

export interface DailyAnalytics {
  date: string;
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    byPaymentMethod: {
      mobile_money: number;
      bank_transfer: number;
      cash_on_delivery: number;
    };
  };
  users: {
    newRegistrations: number;
    activeUsers: number;
  };
}

export interface MonthlyAnalytics {
  year: number;
  month: number;
  orders: {
    total: number;
    revenue: number;
  };
  users: {
    newRegistrations: number;
    totalActive: number;
  };
  topProducts: TopProduct[];
  topDesigners: TopDesigner[];
}

export interface TopProduct {
  product: {
    _id: string;
    name: string;
    images: string[];
  };
  totalSales: number;
  totalRevenue: number;
  totalViews: number;
}

export interface TopDesigner {
  designer: {
    _id: string;
    name: string;
    email: string;
  };
  orders: number;
  revenue: number;
}

export interface Order {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  designer: {
    name: string;
  };
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  order: {
    _id: string;
    status: string;
    createdAt: string;
  };
  designer: {
    name: string;
  };
  totalAmount: number;
  status: string;
  issueDate: string;
  createdAt: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalInvoices: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Analytics Service
class AnalyticsService extends BaseService {
  // Get dashboard analytics
  async getDashboardAnalytics(days: number = 30): Promise<DashboardAnalytics> {
    try {
      const response = await this.httpClient.get<DashboardAnalytics>(
        `${API_ENDPOINTS.ANALYTICS.DASHBOARD}?days=${days}`,
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get daily analytics
  async getDailyAnalytics(startDate?: string, endDate?: string): Promise<DailyAnalytics[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await this.httpClient.get<DailyAnalytics[]>(
        `${API_ENDPOINTS.ANALYTICS.DAILY}${queryString}`,
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get monthly analytics
  async getMonthlyAnalytics(year?: number, month?: number): Promise<MonthlyAnalytics[]> {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await this.httpClient.get<MonthlyAnalytics[]>(
        `${API_ENDPOINTS.ANALYTICS.MONTHLY}${queryString}`,
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get user invoices
  async getUserInvoices(page: number = 1, limit: number = 10): Promise<InvoicesResponse> {
    try {
      const response = await this.httpClient.get<InvoicesResponse>(
        `${API_ENDPOINTS.ANALYTICS.INVOICES}?page=${page}&limit=${limit}`,
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Create invoice for order
  async createInvoice(orderId: string): Promise<Invoice> {
    try {
      const response = await this.httpClient.post<Invoice>(
        API_ENDPOINTS.ANALYTICS.CREATE_INVOICE(orderId),
        {},
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Download invoice PDF
  async downloadInvoice(invoiceId: string): Promise<void> {
    try {
      console.log('Downloading invoice:', invoiceId);
      const token = localStorage.getItem('accessToken');
      console.log('Using token:', token ? 'Token present' : 'No token');

      const url = `${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.ANALYTICS.DOWNLOAD_INVOICE(invoiceId)}`;
      console.log('Download URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', errorText);
        throw new Error(`Failed to download invoice: ${response.status} ${response.statusText}`);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      console.log('Content type:', contentType);

      if (!contentType?.includes('application/pdf')) {
        const responseText = await response.text();
        console.error('Expected PDF but got:', contentType, responseText);
        throw new Error('Invalid response format - expected PDF');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `invoice-${invoiceId}.pdf`;

      console.log('Filename:', filename);

      // Create blob and download
      const blob = await response.blob();
      console.log('Blob size:', blob.size);

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      console.log('Download initiated successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw new Error(`Failed to download invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Track product view (for analytics)
  async trackProductView(productId: string): Promise<void> {
    try {
      // This would be a fire-and-forget request
      await this.httpClient.post(
        API_ENDPOINTS.ANALYTICS.TRACK_VIEW,
        { productId },
        false // Optional authentication
      );
    } catch (error) {
      // Silently fail for tracking requests
      console.warn('Failed to track product view:', error);
    }
  }

  // Track add to cart (for analytics)
  async trackAddToCart(productId: string): Promise<void> {
    try {
      // This would be a fire-and-forget request
      await this.httpClient.post(
        API_ENDPOINTS.ANALYTICS.TRACK_CART,
        { productId },
        false // Optional authentication
      );
    } catch (error) {
      // Silently fail for tracking requests
      console.warn('Failed to track add to cart:', error);
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
