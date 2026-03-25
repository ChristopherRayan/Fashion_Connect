// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  TIMEOUT: 30000, // 30 seconds - increased for better stability
  RETRY_ATTEMPTS: 3,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  // Product endpoints
  PRODUCTS: {
    LIST: '/products',
    CATEGORIES: '/products/categories',
    DETAIL: (id: string) => `/products/${id}`,
    REVIEWS: (id: string) => `/products/${id}/reviews`,
  },
  // Order endpoints
  ORDERS: {
    CREATE: '/orders',
    MY_ORDERS: '/orders/my-orders',
    DESIGNER_ORDERS: '/orders/designer-orders',
    DETAIL: (id: string) => `/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    APPROVE: (id: string) => `/orders/${id}/approve`,
    REJECT: (id: string) => `/orders/${id}/reject`,
    CREATE_INVOICE: (orderId: string) => `/orders/${orderId}/invoice`,
    DOWNLOAD_INVOICE: (orderId: string) => `/orders/${orderId}/invoice/download`,
    DOWNLOAD_RECEIPT: (orderId: string) => `/orders/${orderId}/receipt`,
  },
  // Custom Order endpoints
  CUSTOM_ORDERS: {
    CREATE: '/custom-orders',
    MY_ORDERS: '/custom-orders/my-orders',
    DESIGNER_ORDERS: '/custom-orders/designer-orders',
    GET_BY_ID: (id: string) => `/custom-orders/${id}`,
    UPDATE_STATUS: (id: string) => `/custom-orders/${id}/status`,
  },
  // Designer endpoints
  DESIGNERS: {
    LIST: '/designers',
    PROFILE: (id: string) => `/designers/${id}`,
    ANALYTICS: '/designers/dashboard/analytics',
  },
  // Admin endpoints
  ADMIN: {
    USERS: '/admin/users',
    USER_STATUS: (id: string) => `/admin/users/${id}/status`,
    PENDING_DESIGNERS: '/admin/designers/pending',
    APPROVE_DESIGNER: (userId: string) => `/admin/designers/${userId}/approve`,
    REJECT_DESIGNER: (userId: string) => `/admin/designers/${userId}/reject`,
    UPDATE_USER_STATUS: (userId: string) => `/admin/users/${userId}/status`,
    PRODUCTS: '/admin/products',
    REMOVE_PRODUCT: (productId: string) => `/admin/products/${productId}/remove`,
    UPDATE_PRODUCT_STATUS: (productId: string) => `/admin/products/${productId}/status`,
    DEACTIVATE_USER: (userId: string) => `/admin/users/${userId}/deactivate`,
    UPDATE_USER: (userId: string) => `/admin/users/${userId}`,
    MODERATION_STATS: '/admin/moderation/stats',
    ANALYTICS: '/admin/analytics',
    ORDERS: '/admin/orders',
  },
  // Message endpoints
  MESSAGES: {
    CONVERSATIONS: '/messages/conversations',
    CONVERSATION_MESSAGES: (id: string) => `/messages/conversations/${id}/messages`,
    SEND: '/messages/send',
    START_CONVERSATION: '/messages/start-conversation',
    MARK_READ: (id: string) => `/messages/conversations/${id}/read`,
  },
  // Analytics endpoints
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    DAILY: '/analytics/daily',
    MONTHLY: '/analytics/monthly',
    INVOICES: '/analytics/invoices',
    CREATE_INVOICE: (orderId: string) => `/analytics/invoices/${orderId}`,
    DOWNLOAD_INVOICE: (invoiceId: string) => `/analytics/invoices/${invoiceId}/download`,
    TRACK_VIEW: '/analytics/track/view',
    TRACK_CART: '/analytics/track/cart',
  },
  // Notification endpoints
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: '/notifications/:notificationId/read',
    MARK_ALL_READ: '/notifications/mark-all-read',
    DELETE: '/notifications/:notificationId',
    CREATE: '/notifications/create',
    STATS: '/notifications/stats'
  },
  // Complaint endpoints
  COMPLAINTS: {
    CREATE: '/complaints',
    MY_COMPLAINTS: '/complaints/my-complaints',
    ALL: '/complaints/all',
    STATS: '/complaints/stats',
    DETAIL: (id: string) => `/complaints/${id}`,
    UPDATE: (id: string) => `/complaints/${id}`,
    DELETE: (id: string) => `/complaints/${id}`,
  },
  // User endpoints
  USERS: {
    PROFILE: '/users/profile',
    PROFILE_PICTURE: '/users/profile/picture',
    BUSINESS_LOGO: '/users/business/logo',
  },
  // Payment endpoints
  PAYMENTS: {
    BASE: '/payments',
    METHODS: '/payments/methods',
    CREATE_ORDER: '/payments/create-order',
    MOBILE_PAYMENT: '/payments/mobile-payment',
    STATUS: '/payments/status',
    HISTORY: '/payments/history',
    WEBHOOK: '/payments/webhook'
  },
  // Health check
  HEALTH: '/health',
} as const;
