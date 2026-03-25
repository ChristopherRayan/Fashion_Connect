import { BaseService } from './baseService';
import { API_ENDPOINTS } from '../config/api';
import { ApiResponse } from './httpClient';
import { User, UserRole } from '../types';

// Auth API request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  location?: string;
  businessName?: string;
  fashionCategory?: string;
  experience?: string;
  portfolio?: string;
  verificationToken?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface VerifyEmailRequest {
  token: string;
}

// Authentication Service
class AuthService extends BaseService {
  // Helper method to store tokens
  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  // Helper method to store user data
  private storeUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }
  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔍 AuthService: Starting login with credentials:', credentials);
      console.log('🌐 AuthService: API endpoint:', API_ENDPOINTS.AUTH.LOGIN);

      const response = await this.httpClient.post<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials,
        false // Don't include auth header for login
      );

      console.log('✅ AuthService: Login response received:', response);

      const authData = this.extractData(response);

      // Store tokens in localStorage
      if (authData.accessToken) {
        this.storeTokens(authData.accessToken, authData.refreshToken);
        this.storeUser(authData.user);
        console.log('💾 AuthService: Tokens stored in localStorage');
      }

      return authData;
    } catch (error) {
      console.error('❌ AuthService: Login error:', error);
      this.handleError(error);
    }
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.httpClient.post<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.AUTH.REGISTER,
        userData,
        false // Don't include auth header for registration
      );

      // Registration now returns tokens and user data for automatic login
      const registrationData = this.extractData(response) as AuthResponse;

      // Store tokens and user data
      if (registrationData.accessToken) {
        this.storeTokens(registrationData.accessToken, registrationData.refreshToken);
        this.storeUser(registrationData.user);
      }

      return registrationData;
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 409) {
        throw new Error('User with this email already exists');
      }
      this.handleError(error);
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await this.httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.warn('Logout request failed:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.httpClient.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.ME);

      const userData = this.extractData(response);

      // Update user in localStorage
      this.storeUser(userData);

      return userData;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      await this.httpClient.post(
        '/auth/reset-password', // This endpoint might need to be added to backend
        { email },
        false
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  // Verify email
  async verifyEmail(email: string, token: string): Promise<{ email: string; verified: boolean; token: string; verifiedAt: string }> {
    try {
      const response = await this.httpClient.post<ApiResponse<{ email: string; verified: boolean; token: string; verifiedAt: string }>>(
        '/email-verification/verify-email',
        { email, token },
        false
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await this.httpClient.patch<ApiResponse<User>>(
        '/auth/profile', // This endpoint might need to be added to backend
        userData
      );

      const updatedUser = this.extractData(response);

      // Update user in localStorage
      this.storeUser(updatedUser);

      return updatedUser;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Get stored user data
  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }

  // Get stored access token
  getStoredToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}

// Export singleton instance
export const authService = new AuthService();
