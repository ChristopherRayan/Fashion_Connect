import { BaseService, PaginatedResponse, SearchParams } from './baseService';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';
import { ApiResponse } from './httpClient';

// Product types (these should match your existing types)
export interface ProductImage {
  url: string;
  colorName?: string;
  colorLabel?: string;
  description?: string;
}

// Measurement configuration interfaces
export interface MeasurementField {
  field: string;
  label: string;
  required: boolean;
  unit: string;
  placeholder?: string;
  helpText?: string;
}

export interface MeasurementCategory {
  category: string;
  measurements: MeasurementField[];
}

export interface MeasurementConfig {
  enabled: boolean;
  guideImage?: string;
  requiredMeasurements: MeasurementCategory[];
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[] | ProductImage[]; // Support both old format and new format with color metadata
  category: string;
  subcategory?: string;
  tags: string[];
  colors: string[];
  sizes: string[];
  sizeStock?: { size: string; quantity: number }[];
  materials?: string[];
  inStock: boolean;
  stockQuantity: number;
  designer: {
    _id: string;
    name: string;
    specialty?: string;
  };
  featured: boolean;
  customizable: boolean;
  measurementConfig?: MeasurementConfig;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  product: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// Product query parameters
export interface ProductSearchParams extends SearchParams {
  category?: string;
  designer?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  isFeatured?: boolean;
  isCustomizable?: boolean;
  hasDiscount?: boolean;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  // Allow per-image color metadata
  images: (string | ProductImage)[];
  category: string;
  tags: string[];
  colors: string[];
  sizes: string[];
  stockQuantity?: number;
  featured?: boolean;
  customizable?: boolean;
  measurementConfig?: MeasurementConfig;
}

export interface CreateReviewRequest {
  rating: number;
  title: string;
  comment: string;
}

// Product Service
class ProductService extends BaseService {
  // Helper method to process image URLs
  private processImageUrls(product: Product): Product {
    const baseUrl = API_CONFIG.BASE_URL.replace('/api/v1', '');
    return {
      ...product,
      images: product.images.map((image: string | ProductImage) => {
        if (typeof image === 'string') {
          if (image.startsWith('http')) {
            return image; // Already a full URL
          }
          const imagePath = image.startsWith('/uploads/') ? image : `/uploads/${image}`;
          return `${baseUrl}${imagePath}`; // Prepend backend URL
        } else {
          const imgObj = image as ProductImage;
          const rawUrl = imgObj.url || '';
          let finalUrl = rawUrl;
          if (!rawUrl.startsWith('http')) {
            const imagePath = rawUrl.startsWith('/uploads/') ? rawUrl : `/uploads/${rawUrl}`;
            finalUrl = `${baseUrl}${imagePath}`;
          }
          return { ...imgObj, url: finalUrl } as ProductImage;
        }
      })
    };
  }

  // Helper method to process multiple products
  private processProductsImageUrls(products: Product[]): Product[] {
    return products.map(product => this.processImageUrls(product));
  }

  // Get all products with filtering and pagination
  async getProducts(params: ProductSearchParams = {}): Promise<PaginatedResponse<Product>> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<ApiResponse<PaginatedResponse<Product>>>(
        `${API_ENDPOINTS.PRODUCTS.LIST}${queryString}`,
        false // Products are public, no auth required
      );

      const data = this.extractData(response);
      
      // Process image URLs for all products
      data.docs = this.processProductsImageUrls(data.docs);
      
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get featured products
  async getFeaturedProducts(limit = 6): Promise<Product[]> {
    try {
      const response = await this.getProducts({ 
        isFeatured: true, 
        limit,
        page: 1 
      });
      
      return response.docs;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get product by ID
  async getProductById(productId: string): Promise<Product> {
    try {
      const response = await this.httpClient.get<ApiResponse<Product>>(
        API_ENDPOINTS.PRODUCTS.DETAIL(productId),
        false // Product details are public
      );

      const product = this.extractData(response);
      // Process image URLs for the product
      return this.processImageUrls(product);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get products by category
  async getProductsByCategory(category: string, params: SearchParams = {}): Promise<PaginatedResponse<Product>> {
    try {
      return await this.getProducts({ ...params, category });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get products by designer
  async getProductsByDesigner(designerId: string, params: SearchParams = {}): Promise<PaginatedResponse<Product>> {
    try {
      return await this.getProducts({ ...params, designer: designerId });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Search products
  async searchProducts(query: string, params: SearchParams = {}): Promise<PaginatedResponse<Product>> {
    try {
      return await this.getProducts({ ...params, query });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Create product (for designers)
  async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      const response = await this.httpClient.post<ApiResponse<Product>>(
        API_ENDPOINTS.PRODUCTS.LIST,
        productData
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update product (for designers)
  async updateProduct(productId: string, productData: Partial<CreateProductRequest>): Promise<Product> {
    try {
      const response = await this.httpClient.put<ApiResponse<Product>>(
        API_ENDPOINTS.PRODUCTS.DETAIL(productId),
        productData
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Delete product (for designers)
  async deleteProduct(productId: string): Promise<void> {
    try {
      await this.httpClient.delete<ApiResponse<null>>(
        API_ENDPOINTS.PRODUCTS.DETAIL(productId)
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get designer's own products
  async getDesignerProducts(params: ProductSearchParams = {}): Promise<PaginatedResponse<Product>> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<ApiResponse<PaginatedResponse<Product>>>(
        `${API_ENDPOINTS.PRODUCTS.LIST}/designer/my-products${queryString}`
      );

      const data = this.extractData(response);
      // Process image URLs for all products
      data.docs = this.processProductsImageUrls(data.docs);
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get product reviews
  async getProductReviews(productId: string, params: SearchParams = {}): Promise<PaginatedResponse<Review>> {
    try {
      const queryString = this.buildQueryString(params);
      const response = await this.httpClient.get<PaginatedResponse<Review>>(
        `${API_ENDPOINTS.PRODUCTS.REVIEWS(productId)}${queryString}`,
        false // Reviews are public
      );

      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Create product review (for clients)
  async createProductReview(productId: string, reviewData: CreateReviewRequest): Promise<Review> {
    try {
      const response = await this.httpClient.post<ApiResponse<Review>>(
        API_ENDPOINTS.PRODUCTS.REVIEWS(productId),
        reviewData
      );

      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get product categories
  async getCategories(): Promise<string[]> {
    try {
      const response = await this.httpClient.get<ApiResponse<string[]>>(
        `${API_ENDPOINTS.PRODUCTS.CATEGORIES}`,
        false // No authentication required
      );

      return this.extractData(response);
    } catch (error) {
      console.warn('Failed to fetch categories from API, using fallback:', error);
      // Fallback categories if API fails
      return [
        "Men's - Top",
        "Men's - Bottom",
        "Women's - Top",
        "Women's - Bottom",
        "Unisex - Top",
        "Unisex - Bottom",
        "Accessories",
        "Footwear",
        "Traditional Wear",
        "Custom",
        "Wedding & Bridal",
        "Formal Wear",
        "Casual Wear",
        "Kids & Children",
        "Bags & Purses",
        "Jewelry",
        "Hats & Headwear",
        "Sportswear",
        "Vintage & Retro",
        "Plus Size"
      ];
    }
  }

  // Get category statistics with product counts
  async getCategoryStats(): Promise<Array<{
    category: string;
    productCount: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
  }>> {
    try {
      const response = await this.httpClient.get<ApiResponse<Array<{
        category: string;
        productCount: number;
        averagePrice: number;
        priceRange: { min: number; max: number };
      }>>>(
        `${API_ENDPOINTS.PRODUCTS.CATEGORIES}/stats`,
        false // No authentication required
      );

      return this.extractData(response);
    } catch (error) {
      console.warn('Failed to fetch category stats from API:', error);
      return [];
    }
  }

  async getOutOfStockCount(): Promise<{ count: number }> {
    try {
      const response = await this.httpClient.get<ApiResponse<{ count: number }>>(
        '/products/designer/out-of-stock-count',
        true // Requires authentication
      );
      return this.extractData(response);
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Export singleton instance
export const productService = new ProductService();
