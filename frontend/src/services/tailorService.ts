import { API_CONFIG } from '../config/api';
import { Tailor, CustomOrder } from '../types';

interface CreateTailorData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  specialties?: string[];
  experience?: number;
}

interface UpdateTailorData {
  name?: string;
  email?: string; // kept for compatibility but will be ignored from UI
  phone?: string;
  address?: string;
  specialties?: string[];
  experience?: number;
  bio?: string;
  profileImage?: string; // URL returned by backend
  imageFile?: File | null; // local file to upload
}

interface AssignOrderData {
  tailorId: string;
  notes?: string;
}

interface UpdateOrderStatusData {
  status: string;
  notes?: string;
}

interface TailorDashboardData {
  stats: {
    total: number;
    processing: number;
    completed: number;
    pending: number;
  };
  recentOrders: CustomOrder[];
  designer: {
    id: string;
    name: string;
    email: string;
    businessName?: string;
  };
}

interface TailorContacts {
  designer: {
    id: string;
    name: string;
    email: string;
    businessName?: string;
    profileImage?: string;
    role: string;
    isOnline: boolean;
  };
  tailors: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    specialties: string[];
    experience: number;
    role: string;
    isOnline: boolean;
  }[];
}

class TailorService {
  private baseUrl = `${API_CONFIG.BASE_URL}/tailors`;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit & { requireAuth?: boolean } = {}
  ): Promise<T> {
    const { requireAuth = true, ...fetchOptions } = options;
    const token = localStorage.getItem('accessToken');
    // Build headers dynamically to avoid setting invalid Content-Type for FormData
    const headers: Record<string, string> = { ...(fetchOptions.headers as any) };
    if (!(fetchOptions.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    if (requireAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    } as RequestInit);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Some endpoints (like image upload) may return no JSON body
    const text = await response.text();
    try {
      const data = text ? JSON.parse(text) : {};
      const result = (data.data || data) as T;

      // Transform MongoDB _id to id for frontend compatibility
      return this.transformMongoData(result);
    } catch {
      return {} as T;
    }
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

  // Designer methods
  async inviteTailor(tailorData: CreateTailorData): Promise<{ email: string; name: string; phone?: string; invitationSent: boolean; expiresIn: string }> {
    return this.makeRequest<{ email: string; name: string; phone?: string; invitationSent: boolean; expiresIn: string }>(
      '/invite',
      { method: 'POST', body: JSON.stringify(tailorData) }
    );
  }

  // Keep the old method name for backward compatibility
  async createTailor(tailorData: CreateTailorData) {
    return this.inviteTailor(tailorData);
  }

  async getDesignerTailors(): Promise<Tailor[]> {
    return this.makeRequest<Tailor[]>('/my-tailors');
  }

  async assignOrderToTailor(orderId: string, assignData: AssignOrderData): Promise<CustomOrder> {
    return this.makeRequest<CustomOrder>(`/assign-order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(assignData),
    });
  }

  async updateTailorStatus(tailorId: string, isActive: boolean): Promise<Tailor> {
    return this.makeRequest<Tailor>(`/${tailorId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async resendInvitation(tailorId: string): Promise<{ message: string; expiresIn: string }> {
    return this.makeRequest<{ message: string; expiresIn: string }>(`/${tailorId}/resend-invitation`, { method: 'POST' });
  }

  async getTailorDetails(tailorId: string): Promise<Tailor> {
    return this.makeRequest<Tailor>(`/${tailorId}/details`);
  }

  // Public methods (no auth required)
  async verifyInvitation(token: string) {
    return this.makeRequest(`/verify/${token}`, { requireAuth: false });
  }

  async completeTailorSetup(setupData: {
    token: string;
    password: string;
    confirmPassword: string;
    address?: string;
    specialties?: string[];
    experience?: number;
  }): Promise<{ user: any; accessToken: string; refreshToken: string; }>{
    return this.makeRequest('/setup', {
      method: 'POST',
      body: JSON.stringify(setupData),
      requireAuth: false,
    });
  }

  // Tailor methods
  async getTailorDashboard(): Promise<TailorDashboardData> {
    return this.makeRequest<TailorDashboardData>('/dashboard');
  }

  async getTailorOrders(params?: { status?: string; page?: number; limit?: number; sortBy?: string; sortType?: string; dueBefore?: string; search?: string; }): Promise<{
    docs: CustomOrder[];
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>{
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortType) queryParams.append('sortType', params.sortType);
    if (params?.dueBefore) queryParams.append('dueBefore', params.dueBefore);
    if (params?.search) queryParams.append('search', params.search);
    const endpoint = `/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async getTailorOrderById(orderId: string): Promise<CustomOrder> {
    return this.makeRequest<CustomOrder>(`/orders/${orderId}`);
  }

  async updateOrderStatus(orderId: string, statusData: UpdateOrderStatusData): Promise<CustomOrder> {
    return this.makeRequest<CustomOrder>(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify(statusData) });
  }

  async getTailorStats(): Promise<{
    totalAssignedOrders: number;
    processingOrders: number;
    completedOrders: number;
    totalEarnings: number;
    completedThisWeek: number;
    averageCompletionTime: number;
  }>{
    return this.makeRequest('/stats');
  }

  async getTailorProfile(): Promise<any> {
    return this.makeRequest('/profile');
  }

  // Supports multipart upload when imageFile is provided
  async updateTailorProfile(profileData: UpdateTailorData): Promise<any> {
    if (profileData.imageFile) {
      const form = new FormData();
      if (profileData.name !== undefined) form.append('name', profileData.name);
      if (profileData.phone !== undefined) form.append('phone', profileData.phone);
      if (profileData.address !== undefined) form.append('address', profileData.address);
      if (profileData.bio !== undefined) form.append('bio', profileData.bio);
      if (profileData.experience !== undefined) form.append('experience', String(profileData.experience));
      if (profileData.specialties && Array.isArray(profileData.specialties)) {
        // Send as single JSON array for consistency
        form.append('specialties', JSON.stringify(profileData.specialties));
      }
      form.append('image', profileData.imageFile);
      return this.makeRequest('/profile', { method: 'PATCH', body: form });
    }

    // JSON route
    const { imageFile, ...jsonPayload } = profileData;
    return this.makeRequest('/profile', { method: 'PATCH', body: JSON.stringify(jsonPayload) });
  }

  async getTailorContacts(): Promise<TailorContacts> {
    return this.makeRequest<TailorContacts>('/contacts');
  }

  // Designer methods for managing tailors
  async getTailors(params?: { page?: number; limit?: number; search?: string; isActive?: boolean; }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    const endpoint = `${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async updateTailor(tailorId: string, tailorData: UpdateTailorData) {
    if ((tailorData as any).imageFile) {
      const form = new FormData();
      Object.entries(tailorData).forEach(([k, v]) => {
        if (k === 'imageFile' && v instanceof File) {
          form.append('image', v);
        } else if (Array.isArray(v)) {
          v.forEach(item => form.append(`${k}[]`, String(item)));
        } else if (v !== undefined && v !== null) {
          form.append(k, String(v));
        }
      });
      return this.makeRequest(`/${tailorId}`, { method: 'PATCH', body: form });
    }
    return this.makeRequest(`/${tailorId}`, { method: 'PATCH', body: JSON.stringify(tailorData) });
  }

  async deleteTailor(tailorId: string): Promise<void> {
    return this.makeRequest(`/${tailorId}`, { method: 'DELETE' });
  }

  // Utility methods
  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'assigned_to_tailor': 'bg-primary-100 text-primary-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'tailor_completed': 'bg-green-100 text-green-800',
      'ready_for_shipping': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-indigo-100 text-indigo-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'rejected': 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'assigned_to_tailor': 'Assigned to Tailor',
      'processing': 'Processing',
      'tailor_completed': 'Completed by Tailor',
      'ready_for_shipping': 'Ready for Shipping',
      'shipped': 'Shipped',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'rejected': 'Rejected',
    };
    return statusLabels[status] || status;
  }

  canTailorUpdateStatus(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'assigned_to_tailor': ['processing'],
      'processing': ['tailor_completed'],
    };
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  getNextTailorStatus(currentStatus: string): string | null {
    const nextStatus: Record<string, string> = {
      'assigned_to_tailor': 'processing',
      'processing': 'tailor_completed',
    };
    return nextStatus[currentStatus] || null;
  }
}

export const tailorService = new TailorService();
export default tailorService;
export type { TailorContacts };