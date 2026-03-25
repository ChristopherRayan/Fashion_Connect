import { API_CONFIG } from '../config/api';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: any[];
}

// HTTP Client class with request caching and rate limiting
class HttpClient {
  private baseURL: string;
  private timeout: number;
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private readonly MAX_CONCURRENT_REQUESTS = 3;
  private activeRequests = 0;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Rate limiting: queue requests if too many are active
  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          this.activeRequests++;
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      });
      this.processQueue();
    });
  }

  // Process queued requests
  private processQueue(): void {
    if (this.isProcessingQueue || this.activeRequests >= this.MAX_CONCURRENT_REQUESTS || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const nextRequest = this.requestQueue.shift();
    if (nextRequest) {
      nextRequest().finally(() => {
        this.isProcessingQueue = false;
        setTimeout(() => this.processQueue(), 100); // Small delay between requests
      });
    } else {
      this.isProcessingQueue = false;
    }
  }

  // Check if request is cached and still valid
  private getCachedRequest<T>(cacheKey: string): T | null {
    const cached = this.requestCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log('🚀 Using cached response for:', cacheKey);
      return cached.data;
    }
    return null;
  }

  // Cache a successful request
  private setCachedRequest(cacheKey: string, data: any): void {
    this.requestCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  // Generate cache key for GET requests
  private generateCacheKey(endpoint: string, method: string): string {
    return `${method}:${endpoint}`;
  }

  // Get auth token from localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Create request headers
  private createHeaders(includeAuth = true, isFormData = false): HeadersInit {
    const headers: HeadersInit = {};

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Handle API response
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data;
    if (isJson) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle different error status codes
      if (response.status === 401) {
        // Unauthorized - clear auth data and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      const error: ApiError = {
        success: false,
        statusCode: response.status,
        message: data?.message || `HTTP Error: ${response.status}`,
        errors: data?.errors,
      };

      throw error;
    }

    return data;
  }

  // Generic request method with retry logic
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth = true,
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.createHeaders(includeAuth, options.body instanceof FormData);

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    // Debug logging (reduced verbosity)
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 HTTP Request:', {
        method: config.method || 'GET',
        endpoint,
        retry: retryCount
      });
    }

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ HTTP Response:', {
          status: response.status,
          ok: response.ok,
          endpoint
        });
      }
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      console.error('❌ HTTP Error:', {
        message: error instanceof Error ? error.message : 'Unknown',
        endpoint,
        method: config.method,
        retry: retryCount
      });

      // Retry logic for timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        if (retryCount < API_CONFIG.RETRY_ATTEMPTS) {
          console.log(`🔄 Retrying request (${retryCount + 1}/${API_CONFIG.RETRY_ATTEMPTS})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return this.request<T>(endpoint, options, includeAuth, retryCount + 1);
        }
        throw new Error('Request timeout after multiple retries');
      }

      // Retry logic for network errors
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        if (retryCount < API_CONFIG.RETRY_ATTEMPTS) {
          console.log(`🔄 Retrying request due to network error (${retryCount + 1}/${API_CONFIG.RETRY_ATTEMPTS})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return this.request<T>(endpoint, options, includeAuth, retryCount + 1);
        }
      }

      throw error;
    }
  }

  // HTTP Methods with caching support and rate limiting
  async get<T>(endpoint: string, includeAuth = true): Promise<T> {
    // Check cache for GET requests
    const cacheKey = this.generateCacheKey(endpoint, 'GET');
    const cachedResult = this.getCachedRequest<T>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Use rate limiting for new requests
    return this.queueRequest(async () => {
      const result = await this.request<T>(endpoint, { method: 'GET' }, includeAuth);
      
      // Cache successful GET requests
      this.setCachedRequest(cacheKey, result);
      
      return result;
    });
  }

  async post<T>(endpoint: string, data?: any, includeAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      },
      includeAuth
    );
  }

  async put<T>(endpoint: string, data?: any, includeAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  async patch<T>(endpoint: string, data?: any, includeAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  async delete<T>(endpoint: string, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, includeAuth);
  }
}

// Export singleton instance
export const httpClient = new HttpClient();
