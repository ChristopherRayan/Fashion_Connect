// Utility functions for handling product images

export interface ProductImage {
  url: string;
  colorName?: string;
  colorLabel?: string;
  description?: string;
}

/**
 * Extract image URL from ProductImage object or string
 * @param image - ProductImage object or string URL
 * @param fallback - Fallback URL if image is invalid
 * @returns string URL
 */
export const getProductImageUrl = (image: any, fallback: string = '/placeholder-image.svg'): string => {
  if (!image) return fallback;
  
  // If it's a ProductImage object, extract the URL
  if (typeof image === 'object' && image.url) {
    return image.url;
  }
  
  // If it's a string, return it directly
  if (typeof image === 'string') {
    return image;
  }
  
  return fallback;
};

/**
 * Extract the first image URL from a product's images array
 * @param images - Array of ProductImage objects or strings
 * @param fallback - Fallback URL if no valid image found
 * @returns string URL
 */
export const getFirstProductImageUrl = (images: (string | ProductImage)[] | undefined, fallback: string = '/placeholder-image.svg'): string => {
  if (!images || images.length === 0) return fallback;
  return getProductImageUrl(images[0], fallback);
};

/**
 * Extract all image URLs from a product's images array
 * @param images - Array of ProductImage objects or strings
 * @returns Array of string URLs
 */
export const getAllProductImageUrls = (images: (string | ProductImage)[] | undefined): string[] => {
  if (!images || images.length === 0) return [];
  
  return images.map(image => getProductImageUrl(image)).filter(Boolean);
};