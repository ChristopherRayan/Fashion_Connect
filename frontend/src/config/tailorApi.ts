// Tailor API Endpoints
export const TAILOR_ENDPOINTS = {
  BASE: '/tailors',
  INVITE: '/tailors/invite',
  MY_TAILORS: '/tailors/my-tailors',
  ASSIGN_ORDER: (orderId: string) => `/tailors/assign-order/${orderId}`,
  STATUS: (tailorId: string) => `/tailors/${tailorId}/status`,
  RESEND_INVITE: (tailorId: string) => `/tailors/${tailorId}/resend-invitation`,
  DETAILS: (tailorId: string) => `/tailors/${tailorId}/details`,
  VERIFY: (token: string) => `/tailors/verify/${token}`,
  SETUP: '/tailors/setup',
  DASHBOARD: '/tailors/dashboard',
  ORDERS: '/tailors/orders',
  ORDER_STATUS: (orderId: string) => `/tailors/orders/${orderId}/status`,
  STATS: '/tailors/stats',
  PROFILE: '/tailors/profile',
};