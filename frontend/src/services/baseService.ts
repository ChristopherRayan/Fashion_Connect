import { httpClient, ApiResponse, ApiError } from './httpClient';

// Base service class that other services can extend
export abstract class BaseService {
  protected httpClient = httpClient;

  // Handle API errors and convert them to user-friendly messages
  protected handleError(error: unknown): never {
    if (this.isApiError(error)) {
      throw new Error(error.message);
    }

    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error('An unexpected error occurred');
  }

  // Type guard for API errors
  protected isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'success' in error &&
      'statusCode' in error &&
      'message' in error
    );
  }

  // Extract data from API response
  protected extractData<T>(response: ApiResponse<T>): T {
    return response.data;
  }

  // Build query string from parameters
  protected buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}

// Common API response types
export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

// Common query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends PaginationParams {
  query?: string;
  sortBy?: string;
  sortType?: 'asc' | 'desc';
}
