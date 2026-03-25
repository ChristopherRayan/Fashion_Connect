import { BaseService } from './baseService';
import { API_ENDPOINTS } from '../config/api';
import { ApiResponse } from './httpClient';
import { Product } from '../types';

// Vector search specific types
export interface SimilarProduct extends Product {
  similarity: number;
}

export interface SimilarProductsResponse {
  targetProduct: {
    _id: string;
    name: string;
    category: string;
  };
  similarProducts: SimilarProduct[];
  count: number;
}

export interface SearchResultsResponse {
  query: string;
  results: SimilarProduct[];
  count: number;
}

export interface RecommendationsResponse {
  preferences?: string;
  recommendations: SimilarProduct[];
  count: number;
  type: 'featured' | 'personalized';
}

export interface EmbeddingStats {
  totalProducts: number;
  productsWithEmbeddings: number;
  embeddingCoverage: number;
  cacheStats: {
    size: number;
    dimension: number;
  };
}

// Vector Search Service
class VectorSearchService extends BaseService {
  
  /**
   * Find products similar to a given product
   */
  async findSimilarProducts(productId: string, limit = 5): Promise<SimilarProduct[]> {
    try {
      const response = await this.httpClient.get<ApiResponse<SimilarProductsResponse>>(
        `/vector/similar/${productId}?limit=${limit}`,
        false // Public endpoint
      );

      const data = this.extractData(response);
      return data.similarProducts;
    } catch (error) {
      console.error('Error finding similar products:', error);
      this.handleError(error);
    }
  }

  /**
   * Search for products using semantic similarity
   */
  async searchSimilarProducts(query: string, limit = 10): Promise<SimilarProduct[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await this.httpClient.get<ApiResponse<SearchResultsResponse>>(
        `/vector/search?query=${encodedQuery}&limit=${limit}`,
        false // Public endpoint
      );

      const data = this.extractData(response);
      return data.results;
    } catch (error) {
      console.error('Error searching similar products:', error);
      this.handleError(error);
    }
  }

  /**
   * Get personalized product recommendations
   */
  async getRecommendations(preferences?: {
    categories?: string[];
    tags?: string[];
    limit?: number;
  }): Promise<SimilarProduct[]> {
    try {
      const params = new URLSearchParams();
      
      if (preferences?.categories?.length) {
        params.set('categories', preferences.categories.join(','));
      }
      
      if (preferences?.tags?.length) {
        params.set('tags', preferences.tags.join(','));
      }
      
      if (preferences?.limit) {
        params.set('limit', preferences.limit.toString());
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/vector/recommendations?${queryString}` : '/vector/recommendations';

      const response = await this.httpClient.get<ApiResponse<RecommendationsResponse>>(
        endpoint,
        false // Public endpoint
      );

      const data = this.extractData(response);
      return data.recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      this.handleError(error);
    }
  }

  /**
   * Get embedding statistics (admin only)
   */
  async getEmbeddingStats(): Promise<EmbeddingStats> {
    try {
      const response = await this.httpClient.get<ApiResponse<EmbeddingStats>>(
        '/vector/stats',
        false // Public endpoint for stats
      );

      return this.extractData(response);
    } catch (error) {
      console.error('Error getting embedding stats:', error);
      this.handleError(error);
    }
  }

  /**
   * Generate embeddings for all products (admin only)
   */
  async generateEmbeddings(): Promise<{ processed: number; errors: number; total: number }> {
    try {
      const response = await this.httpClient.post<ApiResponse<{ processed: number; errors: number; total: number }>>(
        '/vector/generate-embeddings',
        {},
        true // Requires authentication
      );

      return this.extractData(response);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      this.handleError(error);
    }
  }

  /**
   * Get recommendations based on a user's browsing history
   */
  async getPersonalizedRecommendations(
    viewedProducts: string[], 
    limit = 8
  ): Promise<SimilarProduct[]> {
    try {
      // For now, we'll use the most recently viewed product to find similar items
      if (viewedProducts.length === 0) {
        return this.getRecommendations({ limit });
      }

      const mostRecentProduct = viewedProducts[viewedProducts.length - 1];
      return this.findSimilarProducts(mostRecentProduct, limit);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      // Fallback to general recommendations
      return this.getRecommendations({ limit });
    }
  }

  /**
   * Get recommendations for a specific designer's style
   */
  async getDesignerStyleRecommendations(
    designerId: string, 
    excludeProductId?: string,
    limit = 6
  ): Promise<SimilarProduct[]> {
    try {
      // This is a simplified approach - in a full implementation,
      // you might want to analyze the designer's product style patterns
      const preferences = {
        tags: ['designer-style'], // This would be more sophisticated in practice
        limit
      };

      const recommendations = await this.getRecommendations(preferences);
      
      // Filter out the current product if specified
      if (excludeProductId) {
        return recommendations.filter(product => product.id !== excludeProductId);
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting designer style recommendations:', error);
      return [];
    }
  }

  /**
   * Search for products that complement a given product (style matching)
   */
  async findComplementaryProducts(
    productId: string, 
    limit = 4
  ): Promise<SimilarProduct[]> {
    try {
      // This could be enhanced to find products that go well together
      // rather than just similar products
      const similarProducts = await this.findSimilarProducts(productId, limit * 2);
      
      // Filter to get complementary items (different categories but similar style)
      // This is a simplified approach
      return similarProducts.slice(0, limit);
    } catch (error) {
      console.error('Error finding complementary products:', error);
      return [];
    }
  }
}

// Export singleton instance
export const vectorSearchService = new VectorSearchService();
export default vectorSearchService;
