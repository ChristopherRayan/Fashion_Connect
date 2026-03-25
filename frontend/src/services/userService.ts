import { BaseService } from './baseService';
import { API_ENDPOINTS } from '../config/api';
import { ApiResponse } from './httpClient';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
  role: string;
  // Designer specific fields
  businessName?: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessWebsite?: string;
  businessLogo?: string;
  specialty?: string[];
  experience?: number;
  // Client specific fields
  address?: {
    street?: string;
    city?: string;
    country?: string;
  };
  measurements?: {
    bust?: string;
    waist?: string;
    hips?: string;
    shoulder?: string;
    inseam?: string;
    height?: string;
    weight?: string;
  };
  preferences?: {
    newsletter?: boolean;
    promotions?: boolean;
    orderUpdates?: boolean;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  bio?: string;
  // Designer specific
  businessName?: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessWebsite?: string;
  specialty?: string[];
  experience?: number;
  // Client specific
  address?: {
    street?: string;
    city?: string;
    country?: string;
  };
  measurements?: {
    bust?: string;
    waist?: string;
    hips?: string;
    shoulder?: string;
    inseam?: string;
    height?: string;
    weight?: string;
  };
  preferences?: {
    newsletter?: boolean;
    promotions?: boolean;
    orderUpdates?: boolean;
  };
}

class UserService extends BaseService {
  // Get current user profile
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await this.httpClient.get<ApiResponse<UserProfile>>(
        API_ENDPOINTS.AUTH.ME
      );
      return this.extractData(response);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await this.httpClient.put<ApiResponse<UserProfile>>(
        API_ENDPOINTS.USERS.PROFILE,
        data
      );
      return this.extractData(response);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  // Upload profile picture
  async uploadProfilePicture(file: File): Promise<{ profileImage: string }> {
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await this.httpClient.post<ApiResponse<{ profileImage: string }>>(
        API_ENDPOINTS.USERS.PROFILE_PICTURE,
        formData
      );
      return this.extractData(response);
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      throw error;
    }
  }

  // Upload business logo (for designers)
  async uploadBusinessLogo(file: File): Promise<{ businessLogo: string }> {
    try {
      const formData = new FormData();
      formData.append('businessLogo', file);

      const response = await this.httpClient.post<ApiResponse<{ businessLogo: string }>>(
        API_ENDPOINTS.USERS.BUSINESS_LOGO,
        formData
      );
      return this.extractData(response);
    } catch (error) {
      console.error('Failed to upload business logo:', error);
      throw error;
    }
  }

  // Delete profile picture
  async deleteProfilePicture(): Promise<void> {
    try {
      await this.httpClient.delete(API_ENDPOINTS.USERS.PROFILE_PICTURE);
    } catch (error) {
      console.error('Failed to delete profile picture:', error);
      throw error;
    }
  }

  // Upload designer verification documents
  async uploadDesignerDocuments(documents: {
    nationalId?: File;
    businessRegistration?: File;
    taxCertificate?: File;
    portfolio?: File;
  }): Promise<{ documents: any; uploadedCount: number }> {
    try {
      console.log('📤 UserService: Starting document upload...');
      console.log('📄 Documents to upload:', Object.keys(documents));

      // Check authentication
      const token = localStorage.getItem('accessToken');
      console.log('🔑 Auth token exists:', !!token);
      console.log('🔑 Auth token preview:', token ? `${token.substring(0, 20)}...` : 'None');

      const formData = new FormData();
      let fileCount = 0;

      // Append each document if provided
      if (documents.nationalId) {
        formData.append('nationalId', documents.nationalId);
        fileCount++;
        console.log('📎 Added nationalId:', documents.nationalId.name);
      }
      if (documents.businessRegistration) {
        formData.append('businessRegistration', documents.businessRegistration);
        fileCount++;
        console.log('📎 Added businessRegistration:', documents.businessRegistration.name);
      }
      if (documents.taxCertificate) {
        formData.append('taxCertificate', documents.taxCertificate);
        fileCount++;
        console.log('📎 Added taxCertificate:', documents.taxCertificate.name);
      }
      if (documents.portfolio) {
        formData.append('portfolio', documents.portfolio);
        fileCount++;
        console.log('📎 Added portfolio:', documents.portfolio.name);
      }

      console.log(`📊 Total files to upload: ${fileCount}`);
      console.log('🌐 Making request to: /users/designer/documents');

      const response = await this.httpClient.post<ApiResponse<{ documents: any; uploadedCount: number }>>(
        '/users/designer/documents',
        formData,
        true // Explicitly require authentication
      );

      console.log('✅ Upload response received:', response);
      const result = this.extractData(response);
      console.log('📄 Upload result:', result);

      return result;
    } catch (error: any) {
      console.error('❌ UserService: Document upload failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack
      });
      throw error;
    }
  }

  // Get user by ID (public profile)
  async getUserById(userId: string): Promise<UserProfile> {
    try {
      const response = await this.httpClient.get<ApiResponse<UserProfile>>(
        `/users/${userId}`,
        false // No authentication required for public profiles
      );
      return this.extractData(response);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  }

  // Upload profile image
  async uploadProfileImage(formData: FormData): Promise<{ profileImage: string }> {
    try {
      const response = await this.httpClient.post<ApiResponse<{ profileImage: string }>>(
        '/users/upload-profile-image',
        formData,
        true // Requires authentication
      );
      return this.extractData(response);
    } catch (error) {
      console.error('Failed to upload profile image:', error);
      throw error;
    }
  }

  // Upload portfolio images
  async uploadPortfolioImages(formData: FormData): Promise<{ portfolioImages: string[] }> {
    try {
      const response = await this.httpClient.post<ApiResponse<{ portfolioImages: string[] }>>(
        '/users/upload-portfolio-images',
        formData,
        true // Requires authentication
      );
      return this.extractData(response);
    } catch (error) {
      console.error('Failed to upload portfolio images:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
