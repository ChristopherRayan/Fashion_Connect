import { BaseService, PaginatedResponse } from './baseService';
import { API_ENDPOINTS } from '../config/api';
import { ApiResponse } from './httpClient';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    profileImage?: string;
    businessName?: string;
  };
  type: 'ORDER_CREATED' | 'ORDER_APPROVED' | 'ORDER_REJECTED' | 'ORDER_STATUS_UPDATED' | 
        'ORDER_DELIVERED' | 'CUSTOM_ORDER_REQUEST' | 'PAYMENT_RECEIVED' | 
        'INVOICE_GENERATED' | 'MESSAGE_RECEIVED' | 'PRODUCT_REVIEW' | 'SYSTEM_ANNOUNCEMENT';
  title: string;
  message: string;
  data: {
    orderId?: string;
    productId?: string;
    conversationId?: string;
    invoiceId?: string;
    customData?: any;
  };
  read: boolean;
  readAt?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSearchParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export interface UnreadCountResponse {
  count: number;
}

class NotificationService extends BaseService {
  // Get user notifications
  async getNotifications(params: NotificationSearchParams = {}): Promise<PaginatedResponse<Notification>> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<PaginatedResponse<Notification>>(
        `${API_ENDPOINTS.NOTIFICATIONS.LIST}${queryString}`,
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.httpClient.get<ApiResponse<UnreadCountResponse>>(
        API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
        true // Requires authentication
      );

      const data = this.extractData(response);
      return data.count;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await this.httpClient.patch<ApiResponse<Notification>>(
        API_ENDPOINTS.NOTIFICATIONS.MARK_READ.replace(':notificationId', notificationId),
        {},
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<any> {
    try {
      const response = await this.httpClient.patch<ApiResponse<any>>(
        API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
        {},
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.httpClient.delete<ApiResponse<void>>(
        API_ENDPOINTS.NOTIFICATIONS.DELETE.replace(':notificationId', notificationId),
        true // Requires authentication
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  // Create notification (admin only)
  async createNotification(notificationData: {
    recipient: string;
    type: Notification['type'];
    title: string;
    message: string;
    data?: any;
    priority?: Notification['priority'];
    actionRequired?: boolean;
    actionUrl?: string;
  }): Promise<Notification> {
    try {
      const response = await this.httpClient.post<ApiResponse<Notification>>(
        API_ENDPOINTS.NOTIFICATIONS.CREATE,
        notificationData,
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get notification statistics (admin only)
  async getNotificationStats(timeframe: '24h' | '7d' | '30d' = '7d'): Promise<any> {
    try {
      const response = await this.httpClient.get<ApiResponse<any>>(
        `${API_ENDPOINTS.NOTIFICATIONS.STATS}?timeframe=${timeframe}`,
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Helper method to get notification icon based on type
  getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'ORDER_CREATED':
        return '🛍️';
      case 'ORDER_APPROVED':
        return '✅';
      case 'ORDER_REJECTED':
        return '❌';
      case 'ORDER_STATUS_UPDATED':
        return '📦';
      case 'ORDER_DELIVERED':
        return '🚚';
      case 'CUSTOM_ORDER_REQUEST':
        return '🎨';
      case 'PAYMENT_RECEIVED':
        return '💰';
      case 'INVOICE_GENERATED':
        return '📄';
      case 'MESSAGE_RECEIVED':
        return '💬';
      case 'PRODUCT_REVIEW':
        return '⭐';
      case 'SYSTEM_ANNOUNCEMENT':
        return '📢';
      default:
        return '🔔';
    }
  }

  // Helper method to get notification color based on priority
  getNotificationColor(priority: Notification['priority']): string {
    switch (priority) {
      case 'LOW':
        return 'text-gray-600';
      case 'MEDIUM':
        return 'text-blue-600';
      case 'HIGH':
        return 'text-orange-600';
      case 'URGENT':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  // Helper method to format notification time
  formatNotificationTime(createdAt: string): string {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  }
}

export const notificationService = new NotificationService();
