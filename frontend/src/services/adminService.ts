import { BaseService, PaginatedResponse } from './baseService';
import { API_ENDPOINTS } from '../config/api';
import { ApiResponse } from './httpClient';
import { User } from '../types';

// Admin-specific types
export interface AdminUser extends User {
  businessName?: string;
  specialty?: string;
  location?: string;
  bio?: string;
  rejectionReason?: string;
  documents?: {
    nationalId?: string;
    businessRegistration?: string;
    taxCertificate?: string;
    portfolio?: string;
  };
}

export interface AdminAnalytics {
  totalUsers: number;
  totalClients: number;
  totalDesigners: number;
  activeDesigners: number;
  pendingVerifications: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface ModerationStats {
  totalProducts: number;
  pendingReview: number;
  flaggedProducts: number;
  suspendedProducts: number;
  activeProducts: number;
  newProducts: number;
}

export interface AdminOrder {
  _id: string;
  orderNumber?: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  designer?: {
    _id: string;
    name: string;
    businessName?: string;
    email: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
      images: string[];
      price: number;
    };
    quantity: number;
    price: number;
    size?: string;
  }>;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isCustomOrder?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrdersResponse {
  orders: AdminOrder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface OrderSearchParams {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortType?: 'asc' | 'desc';
}

export interface ProductForModeration {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subcategory?: string;
  sizes?: string[];
  colors?: string[];
  customizable: boolean;
  status: 'ACTIVE' | 'FLAGGED' | 'SUSPENDED' | 'PENDING';
  designer: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  moderationReason?: string;
}

export interface UserSearchParams {
  role?: 'CLIENT' | 'DESIGNER' | 'ADMIN';
  status?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
  page?: number;
  limit?: number;
  search?: string;
}

// Admin Service
class AdminService extends BaseService {
  // Get all users with filtering and pagination
  async getUsers(params: UserSearchParams = {}): Promise<PaginatedResponse<AdminUser>> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<ApiResponse<PaginatedResponse<AdminUser>>>(
        `${API_ENDPOINTS.ADMIN.USERS}${queryString}`
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get pending designers for verification
  async getPendingDesigners(): Promise<AdminUser[]> {
    try {
      const response = await this.httpClient.get<ApiResponse<AdminUser[]>>(
        API_ENDPOINTS.ADMIN.PENDING_DESIGNERS
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Approve designer
  async approveDesigner(userId: string): Promise<AdminUser> {
    try {
      const response = await this.httpClient.patch<ApiResponse<AdminUser>>(
        API_ENDPOINTS.ADMIN.APPROVE_DESIGNER(userId)
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Reject designer
  async rejectDesigner(userId: string, reason: string): Promise<AdminUser> {
    try {
      const response = await this.httpClient.patch<ApiResponse<AdminUser>>(
        API_ENDPOINTS.ADMIN.REJECT_DESIGNER(userId),
        { reason }
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update user status
  async updateUserStatus(userId: string, status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'): Promise<AdminUser> {
    try {
      const response = await this.httpClient.patch<ApiResponse<AdminUser>>(
        API_ENDPOINTS.ADMIN.UPDATE_USER_STATUS(userId),
        { status }
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get admin dashboard analytics
  async getAnalytics(): Promise<AdminAnalytics> {
    try {
      const response = await this.httpClient.get<ApiResponse<AdminAnalytics>>(
        API_ENDPOINTS.ADMIN.ANALYTICS
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Content Moderation Methods

  // Get all products for moderation
  async getProductsForModeration(params: any = {}): Promise<PaginatedResponse<ProductForModeration>> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<ApiResponse<PaginatedResponse<ProductForModeration>>>(
        `${API_ENDPOINTS.ADMIN.PRODUCTS}${queryString}`
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Remove product
  async removeProduct(productId: string, reason: string): Promise<any> {
    try {
      // Use POST method for delete with body data
      const response = await this.httpClient.post<ApiResponse<any>>(
        API_ENDPOINTS.ADMIN.REMOVE_PRODUCT(productId),
        { reason }
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Deactivate user (instead of delete)
  async deactivateUser(userId: string): Promise<AdminUser> {
    try {
      const response = await this.httpClient.patch<ApiResponse<AdminUser>>(
        `/admin/users/${userId}/deactivate`
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update user (restricted to safe fields only)
  async updateUser(userId: string, userData: { status?: string; rejectionReason?: string }): Promise<AdminUser> {
    try {
      // Only allow safe fields - no email, name, password, or role changes
      const safeData: any = {};
      if (userData.status) safeData.status = userData.status;
      if (userData.rejectionReason !== undefined) safeData.rejectionReason = userData.rejectionReason;

      const response = await this.httpClient.put<ApiResponse<AdminUser>>(
        API_ENDPOINTS.ADMIN.UPDATE_USER(userId),
        safeData
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update product status
  async updateProductStatus(productId: string, status: string, reason?: string): Promise<ProductForModeration> {
    try {
      const response = await this.httpClient.patch<ApiResponse<ProductForModeration>>(
        API_ENDPOINTS.ADMIN.UPDATE_PRODUCT_STATUS(productId),
        { status, reason }
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get moderation statistics
  async getModerationStats(): Promise<ModerationStats> {
    try {
      const response = await this.httpClient.get<ApiResponse<ModerationStats>>(
        API_ENDPOINTS.ADMIN.MODERATION_STATS
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get all orders for admin
  async getAllOrders(params: OrderSearchParams = {}): Promise<AdminOrdersResponse> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<ApiResponse<AdminOrdersResponse>>(
        `${API_ENDPOINTS.ADMIN.ORDERS}${queryString}`
      );

      return this.extractData(response);
    } catch (error) {
      console.error('Failed to fetch admin orders:', error);
      // Return empty response as fallback
      return {
        orders: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalOrders: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }
  }

  // Get order statistics
  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }> {
    try {
      // This would be a separate endpoint in a real implementation
      const allOrders = await this.getAllOrders({ limit: 1000 });
      const orders = allOrders.orders;

      return {
        total: orders.length,
        pending: orders.filter(o => o.status === 'PENDING').length,
        processing: orders.filter(o => o.status === 'PROCESSING').length,
        shipped: orders.filter(o => o.status === 'SHIPPED').length,
        delivered: orders.filter(o => o.status === 'DELIVERED').length,
        cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      };
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
      return {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };
    }
  }

  // Helper methods
  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING_VERIFICATION':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'DESIGNER':
        return 'bg-blue-100 text-blue-800';
      case 'CLIENT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatUserRole(role: string): string {
    switch (role) {
      case 'CLIENT':
        return 'Client';
      case 'DESIGNER':
        return 'Designer';
      case 'ADMIN':
        return 'Admin';
      default:
        return role;
    }
  }

  formatUserStatus(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'PENDING_VERIFICATION':
        return 'Pending Verification';
      case 'SUSPENDED':
        return 'Suspended';
      default:
        return status;
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();
