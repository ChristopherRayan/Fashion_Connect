import { BaseService, PaginatedResponse } from './baseService';
import { API_ENDPOINTS } from '../config/api';
import { ApiResponse } from './httpClient';

export interface Complaint {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'product' | 'designer' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminResponse?: string;
  adminUser?: {
    _id: string;
    name: string;
  };
  resolvedAt?: string;
  attachments?: string[];
  relatedOrder?: {
    _id: string;
    orderNumber: string;
  };
  relatedProduct?: {
    _id: string;
    name: string;
  };
  relatedDesigner?: {
    _id: string;
    name: string;
    businessName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintRequest {
  subject: string;
  description: string;
  category: Complaint['category'];
  priority?: Complaint['priority'];
  relatedOrder?: string;
  relatedProduct?: string;
  relatedDesigner?: string;
}

export interface UpdateComplaintRequest {
  status?: Complaint['status'];
  adminResponse?: string;
}

export interface ComplaintSearchParams {
  page?: number;
  limit?: number;
  status?: Complaint['status'];
  category?: Complaint['category'];
  priority?: Complaint['priority'];
  sortBy?: string;
  sortType?: 'asc' | 'desc';
}

export interface ComplaintStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
  high: number;
  pending: number;
}

// Complaint Service
class ComplaintService extends BaseService {
  // Create new complaint (CLIENT only)
  async createComplaint(complaintData: CreateComplaintRequest): Promise<Complaint> {
    try {
      console.log('🚨 Creating complaint with data:', complaintData);
      const response = await this.httpClient.post<ApiResponse<Complaint>>(
        API_ENDPOINTS.COMPLAINTS.CREATE,
        complaintData
      );

      console.log('✅ Complaint created successfully:', response);
      return this.extractData(response);
    } catch (error) {
      console.error('❌ Error creating complaint:', error);
      this.handleError(error);
    }
  }

  // Get current user's complaints (CLIENT only)
  async getMyComplaints(params: ComplaintSearchParams = {}): Promise<PaginatedResponse<Complaint>> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<ApiResponse<PaginatedResponse<Complaint>>>(
        `${API_ENDPOINTS.COMPLAINTS.MY_COMPLAINTS}${queryString}`
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get all complaints (ADMIN only)
  async getAllComplaints(params: ComplaintSearchParams = {}): Promise<PaginatedResponse<Complaint>> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<ApiResponse<PaginatedResponse<Complaint>>>(
        `${API_ENDPOINTS.COMPLAINTS.ALL}${queryString}`
      );

      return this.extractData(response);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      // Return empty response as fallback
      return {
        docs: [],
        totalDocs: 0,
        limit: params.limit || 20,
        page: params.page || 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null
      };
    }
  }

  // Get complaint by ID
  async getComplaintById(complaintId: string): Promise<Complaint> {
    try {
      const response = await this.httpClient.get<ApiResponse<Complaint>>(
        API_ENDPOINTS.COMPLAINTS.DETAIL(complaintId)
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update complaint (ADMIN only)
  async updateComplaint(complaintId: string, updateData: UpdateComplaintRequest): Promise<Complaint> {
    try {
      const response = await this.httpClient.patch<ApiResponse<Complaint>>(
        API_ENDPOINTS.COMPLAINTS.UPDATE(complaintId),
        updateData
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Delete complaint (ADMIN only)
  async deleteComplaint(complaintId: string): Promise<void> {
    try {
      await this.httpClient.delete(
        API_ENDPOINTS.COMPLAINTS.DELETE(complaintId)
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get complaint statistics (ADMIN only)
  async getComplaintStats(): Promise<ComplaintStats> {
    try {
      const response = await this.httpClient.get<ApiResponse<ComplaintStats>>(
        API_ENDPOINTS.COMPLAINTS.STATS
      );

      return this.extractData(response);
    } catch (error) {
      console.error('Failed to fetch complaint stats:', error);
      return {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        urgent: 0,
        high: 0,
        pending: 0
      };
    }
  }

  // Helper methods
  getCategoryLabel(category: Complaint['category']): string {
    const labels = {
      technical: 'Technical Issue',
      billing: 'Billing & Payment',
      product: 'Product Issue',
      designer: 'Designer Related',
      other: 'Other'
    };
    return labels[category] || category;
  }

  getPriorityColor(priority: Complaint['priority']): string {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  }

  getStatusColor(status: Complaint['status']): string {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.open;
  }
}

// Export singleton instance
export const complaintService = new ComplaintService();
export default complaintService;
