import { BaseService, PaginatedResponse, SearchParams } from './baseService';
import { API_ENDPOINTS } from '../config/api';
import { User } from '../types';

// Designer-specific types
export interface Designer extends Omit<User, 'role' | '_id'> {
  _id: string; // Make _id required for designers
  role: 'DESIGNER';
  specialty?: string;
  bio?: string;
  location?: string; // Simple string for city/location
  businessName?: string;
  customOrdersAvailable?: boolean;
  turnaroundTime?: string;
  profileImage?: string;
  portfolio?: {
    images: string[];
    description: string;
  };
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  rating?: number;
  reviewCount?: number;
  totalProducts?: number;
  totalOrders?: number;
  joinedAt?: string;
}

export interface DesignerProfile {
  designer: Designer;
  products: Array<{
    _id: string;
    name: string;
    price: number;
    images: string[];
    rating: number;
    reviewCount: number;
  }>;
  recentWork: string[];
  stats: {
    totalProducts: number;
    totalOrders: number;
    averageRating: number;
    completionRate: number;
  };
}

export interface DesignerAnalytics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    averageRating: number;
    totalViews?: number;
  };
  revenueData: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    _id: string;
    name: string;
    revenue: number;
    orders: number;
  }>;
  ordersByStatus: Record<string, number>;
  customerSatisfaction: {
    rating: number;
    reviews: number;
    responseRate: number;
  };
  pendingOrders?: number;
  lowStockProducts?: number;
}

// Designer query parameters
export interface DesignerSearchParams extends SearchParams {
  specialty?: string;
  location?: string;
  minRating?: number;
  verified?: boolean;
}

// Designer Service
class DesignerService extends BaseService {
  // Get all designers
  async getDesigners(params: DesignerSearchParams = {}): Promise<PaginatedResponse<Designer>> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<{data: PaginatedResponse<Designer>}>(
        `${API_ENDPOINTS.DESIGNERS.LIST}${queryString}`,
        false // Designer list is public
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get featured designers
  async getFeaturedDesigners(limit = 6): Promise<Designer[]> {
    try {
      const response = await this.getDesigners({ 
        limit,
        page: 1,
        sortBy: 'rating',
        sortType: 'desc'
      });
      
      return response.docs;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get designer profile by ID
  async getDesignerProfile(designerId: string): Promise<DesignerProfile> {
    try {
      const response = await this.httpClient.get<{data: DesignerProfile}>(
        API_ENDPOINTS.DESIGNERS.PROFILE(designerId),
        false // Designer profiles are public
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get designers by specialty
  async getDesignersBySpecialty(specialty: string, params: SearchParams = {}): Promise<PaginatedResponse<Designer>> {
    try {
      return await this.getDesigners({ ...params, specialty });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get designers by location
  async getDesignersByLocation(location: string, params: SearchParams = {}): Promise<PaginatedResponse<Designer>> {
    try {
      return await this.getDesigners({ ...params, location });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Search designers
  async searchDesigners(query: string, params: SearchParams = {}): Promise<PaginatedResponse<Designer>> {
    try {
      return await this.getDesigners({ ...params, query });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get designer dashboard analytics (for authenticated designers)
  async getDesignerAnalytics(): Promise<DesignerAnalytics> {
    try {
      const response = await this.httpClient.get<{data: DesignerAnalytics}>(
        API_ENDPOINTS.DESIGNERS.ANALYTICS
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get designer specialties (helper method)
  async getSpecialties(): Promise<string[]> {
    try {
      // This would ideally come from the backend
      // For now, return common specialties
      return [
        'Traditional Wear',
        'Formal Wear',
        'Casual Wear',
        'Wedding Dresses',
        'Evening Wear',
        'Streetwear',
        'Accessories',
        'Footwear',
        'Children\'s Wear',
        'Plus Size',
        'Sustainable Fashion',
        'Haute Couture'
      ];
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get popular locations (helper method)
  async getPopularLocations(): Promise<string[]> {
    try {
      // This would ideally come from the backend
      // For now, return common Malawi locations
      return [
        'Lilongwe',
        'Blantyre',
        'Mzuzu',
        'Zomba',
        'Kasungu',
        'Mangochi',
        'Salima',
        'Balaka',
        'Chiradzulu',
        'Thyolo'
      ];
    } catch (error) {
      this.handleError(error);
    }
  }

  // Follow/Unfollow designer (if this feature exists)
  async followDesigner(designerId: string): Promise<void> {
    try {
      await this.httpClient.post(`/designers/${designerId}/follow`);
    } catch (error) {
      this.handleError(error);
    }
  }

  async unfollowDesigner(designerId: string): Promise<void> {
    try {
      await this.httpClient.delete(`/designers/${designerId}/follow`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Rate designer (if this feature exists)
  async rateDesigner(designerId: string, rating: number, comment?: string): Promise<void> {
    try {
      await this.httpClient.post(`/designers/${designerId}/rate`, {
        rating,
        comment
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get designer rating display
  getRatingDisplay(rating: number): string {
    return `${rating.toFixed(1)} ⭐`;
  }

  // Get designer analytics
  async getAnalytics(): Promise<DesignerAnalytics> {
    try {
      const response = await this.httpClient.get<{data: DesignerAnalytics}>(
        API_ENDPOINTS.DESIGNERS.ANALYTICS,
        true // Requires authentication
      );

      return response.data;
    } catch (error) {
      console.error('Failed to fetch designer analytics:', error);
      // Return mock data as fallback
      return {
        overview: {
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          averageRating: 0,
          totalViews: 0
        },
        revenueData: [],
        topProducts: [],
        ordersByStatus: {},
        customerSatisfaction: {
          rating: 0,
          reviews: 0,
          responseRate: 0
        },
        pendingOrders: 0,
        lowStockProducts: 0
      };
    }
  }

  // Get designer status color for UI
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'ACTIVE': 'green',
      'PENDING': 'yellow',
      'SUSPENDED': 'red',
      'INACTIVE': 'gray'
    };

    return colorMap[status] || 'gray';
  }
}

// Export singleton instance
export const designerService = new DesignerService();
