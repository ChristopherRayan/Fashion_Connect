// Image utility functions

// Create a simple SVG placeholder as base64
const createPlaceholderSVG = (width: number, height: number, text: string = 'No Image') => {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9CA3AF" text-anchor="middle" dy=".3em">${text}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const DEFAULT_PRODUCT_IMAGE = createPlaceholderSVG(400, 300, 'No Image');
export const DEFAULT_PROFILE_IMAGE = createPlaceholderSVG(150, 150, 'No Avatar');

/**
 * Check if an image path is valid and should be displayed
 * @param imagePath - The image path to validate
 * @returns boolean indicating if the path is valid
 */
export const isValidImagePath = (imagePath: string | undefined | null): boolean => {
  if (!imagePath) return false;
  
  const pathStr = typeof imagePath === 'string' ? imagePath.trim() : '';
  
  return pathStr !== '' && 
         pathStr !== 'undefined' && 
         pathStr !== 'null' && 
         pathStr !== 'NULL' && 
         pathStr.toLowerCase() !== 'null' && 
         pathStr.toLowerCase() !== 'undefined';
};

/**
 * Handle image loading errors by setting a fallback image
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>, fallbackUrl?: string) => {
  const target = event.target as HTMLImageElement;
  const fallback = fallbackUrl || DEFAULT_PRODUCT_IMAGE;
  
  // Prevent infinite loop if fallback also fails
  if (target.src !== fallback) {
    console.warn(`🖼️ Image failed to load: ${target.src}, using fallback: ${fallback}`);
    target.src = fallback;
  }
};

/**
 * Get the backend base URL
 */
const getBackendBaseUrl = (): string => {
  // Try to get from environment variable first
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    // If env points to localhost but app is accessed via LAN IP, prefer current hostname for images
    try {
      const { protocol, hostname } = window.location;
      const base = envUrl.replace('/api/v1', '');
      const url = new URL(base);
      const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      if (isLocalhost) {
        return `${protocol}//${hostname}:${url.port || '8000'}`;
      }
      return base;
    } catch {
      return envUrl.replace('/api/v1', '');
    }
  }

  // Fallback to current host with backend port when running in dev over LAN
  try {
    const { protocol, hostname } = window.location;
    // Assume backend is on port 8000
    return `${protocol}//${hostname}:8000`;
  } catch {
    return 'http://localhost:8000';
  }
};

/**
 * Get the full image URL from a relative path or ProductImage object
 */
export const getImageUrl = (imagePath: string | any, baseUrl?: string): string => {
  console.log('🖼️ Processing image path:', imagePath);

  // Handle ProductImage objects with metadata
  if (typeof imagePath === 'object' && imagePath !== null) {
    const imageObj = imagePath as any;
    if (imageObj.url) {
      console.log('🖼️ ProductImage object detected, using url property:', imageObj.url);
      return getImageUrl(imageObj.url, baseUrl); // Recursive call with the URL string
    }
  }

  // Handle string paths
  const pathStr = typeof imagePath === 'string' ? imagePath : '';
  
  // More comprehensive validation for invalid paths
  if (!pathStr || 
      pathStr.trim() === '' || 
      pathStr === 'undefined' || 
      pathStr === 'null' || 
      pathStr === 'NULL' ||
      pathStr.toLowerCase() === 'null' ||
      pathStr.toLowerCase() === 'undefined') {
    console.log('🖼️ Empty or invalid image path, using default:', pathStr);
    return DEFAULT_PRODUCT_IMAGE;
  }

  // If it's already a full URL (http/https), return as is
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
    console.log('🖼️ Full URL provided:', pathStr);
    return pathStr;
  }

  // If it's a data URL, return as is
  if (pathStr.startsWith('data:')) {
    console.log('🖼️ Data URL provided');
    return pathStr;
  }

  // Get the backend base URL
  let backendBase = baseUrl || getBackendBaseUrl();

  // Force LAN host for local upload paths to avoid localhost mismatches
  try {
    if (pathStr.startsWith('/uploads/')) {
      const { protocol, hostname } = window.location;
      backendBase = `${protocol}//${hostname}:8000`;
    }
  } catch {}

  // Clean up the image path
  let cleanPath = pathStr.trim();

  // If path doesn't start with /uploads/, add it
  if (!cleanPath.startsWith('/uploads/')) {
    // Remove leading slash if present
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    cleanPath = `/uploads/${cleanPath}`;
  }

  const fullUrl = `${backendBase}${cleanPath}`;
  console.log(`🖼️ Generated image URL: ${fullUrl}`);
  console.log(`🖼️ Backend base: ${backendBase}`);
  console.log(`🖼️ Clean path: ${cleanPath}`);
  console.log(`🖼️ Original path: ${pathStr}`);
  return fullUrl;
};

/**
 * Preload an image to check if it exists
 */
export const preloadImage = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
};

/**
 * Get optimized image URL with size parameters
 */
export const getOptimizedImageUrl = (imagePath: string | any, width?: number, height?: number): string => {
  console.log('🖼️ getOptimizedImageUrl called with:', { imagePath, width, height });
  
  // Handle ProductImage objects or any object with url property
  let processedImagePath = imagePath;
  if (typeof imagePath === 'object' && imagePath !== null) {
    if (imagePath.url) {
      console.log('🖼️ ProductImage object detected in getOptimizedImageUrl, using url property:', imagePath.url);
      processedImagePath = imagePath.url;
    } else {
      console.warn('🖼️ Object passed to getOptimizedImageUrl without url property:', imagePath);
      return DEFAULT_PRODUCT_IMAGE;
    }
  }
  
  const baseUrl = getImageUrl(processedImagePath);
  console.log('🖼️ Base URL generated:', baseUrl);
  
  if (baseUrl.includes('unsplash.com') && (width || height)) {
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('fit', 'crop');
    params.set('q', '80');
    
    const optimizedUrl = `${baseUrl}&${params.toString()}`;
    console.log('🖼️ Optimized URL for Unsplash:', optimizedUrl);
    return optimizedUrl;
  }
  
  console.log('🖼️ Returning base URL (no optimization needed):', baseUrl);
  return baseUrl;
};
