import { API_CONFIG } from '../config/api';
import { CustomOrder } from '../types';

interface CustomOrdersResponse {
  docs: CustomOrder[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface CreateCustomOrderData {
  productType: string;
  description?: string;
  designer: string;
  color?: string;
  measurements: Record<string, any>;
  estimatedPrice: number;
  expectedDeliveryDate: string;
  deliveryLocation: string;
  additionalNotes?: string;
  productReference?: {
    productId?: string;
    productName?: string;
    productImage?: string;
  };
  attachments?: File[];
  // Add new fields for enhanced custom order support
  deliveryType?: string;
  deliveryTimePrice?: number;
  collectionMethod?: string;
  designerShopAddress?: string;
}

interface UpdateCustomOrderData {
  status?: string;
  estimatedPrice?: number;
  expectedDeliveryDate?: string;
  additionalNotes?: string;
}

class CustomOrderService {
  private baseUrl = `${API_CONFIG.BASE_URL}/custom-orders`;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('accessToken');
    const fullUrl = `${this.baseUrl}${endpoint}`;

    console.log('🌐 customOrderService.makeRequest:');
    console.log('   URL:', fullUrl);
    console.log('   Method:', options.method || 'GET');
    console.log('   Has token:', !!token);

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    console.log('📝 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Request failed:', {
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Raw response data:', data);
    
    const result = data.data || data;
    console.log('📦 Processed result:', result);

    // Transform MongoDB _id to id for frontend compatibility
    return this.transformMongoData(result);
  }

  private transformMongoData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.transformMongoData(item));
    }

    if (data && typeof data === 'object') {
      const transformed = { ...data };

      // Convert _id to id
      if (transformed._id) {
        transformed.id = transformed._id;
        delete transformed._id;
      }

      // Transform nested objects
      Object.keys(transformed).forEach(key => {
        if (transformed[key] && typeof transformed[key] === 'object') {
          transformed[key] = this.transformMongoData(transformed[key]);
        }
      });

      return transformed;
    }

    return data;
  }

  // Client methods
  async createCustomOrder(orderData: CreateCustomOrderData): Promise<CustomOrder> {
    // For now, we'll send JSON data (attachments can be added later if needed)
    const requestData = {
      productType: orderData.productType,
      productReference: orderData.productReference || {},
      designer: orderData.designer,
      color: orderData.color || 'Not specified',
      measurements: orderData.measurements || {},
      expectedDeliveryDate: orderData.expectedDeliveryDate,
      deliveryLocation: orderData.deliveryLocation,
      additionalNotes: orderData.additionalNotes || orderData.description || '',
      estimatedPrice: orderData.estimatedPrice || 0,
      // Include new delivery and collection fields
      deliveryType: orderData.deliveryType || 'standard',
      deliveryTimePrice: orderData.deliveryTimePrice || 0,
      collectionMethod: orderData.collectionMethod || 'delivery',
      designerShopAddress: orderData.designerShopAddress || ''
    };

    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  async getClientCustomOrders(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<CustomOrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/my-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // Designer methods
  async getDesignerCustomOrders(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<CustomOrdersResponse> {
    console.log('🌐 customOrderService.getDesignerCustomOrders called with:', params);
    
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/designer-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const fullUrl = `${this.baseUrl}${endpoint}`;
    
    console.log('🔗 Making request to:', fullUrl);
    console.log('🌐 Base URL:', this.baseUrl);
    console.log('📄 Endpoint:', endpoint);
    
    const result = await this.makeRequest(endpoint);
    
    console.log('📦 Service response:', result);
    
    return result;
  }

  async updateCustomOrderStatus(orderId: string, statusData: {
    status: string;
    notes?: string;
  }): Promise<CustomOrder> {
    return this.makeRequest<CustomOrder>(`/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  }

  async updateCustomOrder(orderId: string, updateData: UpdateCustomOrderData): Promise<CustomOrder> {
    return this.makeRequest<CustomOrder>(`/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  // Common methods
  async getCustomOrderById(orderId: string): Promise<CustomOrder> {
    return this.makeRequest<CustomOrder>(`/${orderId}`);
  }

  async deleteCustomOrder(orderId: string): Promise<void> {
    await this.makeRequest(`/${orderId}`, {
      method: 'DELETE',
    });
  }

  // Utility methods
  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-blue-100 text-blue-800',
      'assigned_to_tailor': 'bg-purple-100 text-purple-800',
      'processing': 'bg-orange-100 text-orange-800',
      'tailor_completed': 'bg-green-100 text-green-800',
      'ready_for_shipping': 'bg-indigo-100 text-indigo-800',
      'shipped': 'bg-gray-100 text-gray-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'rejected': 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'pending': 'Pending Review',
      'accepted': 'Accepted',
      'assigned_to_tailor': 'Assigned to Tailor',
      'processing': 'In Progress',
      'tailor_completed': 'Completed by Tailor',
      'ready_for_shipping': 'Ready for Shipping',
      'shipped': 'Shipped',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'rejected': 'Rejected',
    };
    return statusLabels[status] || status;
  }

  canClientCancel(status: string): boolean {
    return ['pending', 'accepted'].includes(status);
  }

  canDesignerUpdate(status: string): boolean {
    return !['cancelled', 'completed', 'shipped'].includes(status);
  }

  getNextClientStatus(currentStatus: string): string | null {
    // Clients can only cancel orders in certain states
    if (['pending', 'accepted'].includes(currentStatus)) {
      return 'cancelled';
    }
    return null;
  }

  getNextDesignerStatus(currentStatus: string): string | null {
    const nextStatus: Record<string, string> = {
      'pending': 'accepted',
      'tailor_completed': 'ready_for_shipping',
      'ready_for_shipping': 'shipped',
    };
    return nextStatus[currentStatus] || null;
  }
}

export const customOrderService = new CustomOrderService();
export default customOrderService;