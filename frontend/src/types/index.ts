export  enum UserRole {
  CLIENT = 'CLIENT',
  DESIGNER = 'DESIGNER',
  ADMIN = 'ADMIN',
  TAILOR = 'TAILOR'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE'
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY_FOR_SHIPPING = 'ready_for_shipping',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  COMPLETED = 'completed'
}

export type Locale = 'en' | 'ny'; // English and Chichewa

export enum CustomOrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  ASSIGNED_TO_TAILOR = 'assigned_to_tailor',
  PROCESSING = 'processing',
  TAILOR_COMPLETED = 'tailor_completed',
  READY_FOR_SHIPPING = 'ready_for_shipping',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

export interface CustomOrder {
  id: string;
  _id?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  designer: {
    id: string;
    name: string;
    email: string;
    businessName?: string;
  };
  assignedTailor?: {
    id: string;
    name: string;
    email: string;
  };
  productType: string;
  productReference?: {
    productId?: string;
    productName?: string;
    productImage?: string;
  };
  color: string;
  measurements: Record<string, any>;
  expectedDeliveryDate: string;
  deliveryType: 'standard' | 'express' | 'premium';
  deliveryTimePrice: number;
  collectionMethod: 'delivery' | 'pickup';
  deliveryLocation?: string;
  designerShopAddress?: string;
  additionalNotes?: string;
  estimatedPrice: number;
  estimatedDeliveryDate?: string;
  designerNotes?: string;
  tailorNotes?: string;
  status: CustomOrderStatus;
  cancellationReason?: string;
  rejectionReason?: string;
  statusHistory: Array<{
    status: string;
    changedBy: string;
    changedAt: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  rejectedAt?: string;
  acceptedAt?: string;
  assignedToTailorAt?: string;
  tailorCompletedAt?: string;
  readyForShippingAt?: string;
  shippedAt?: string;
}

export interface User {
  id?: string;
  _id?: string; // Backend uses _id, frontend uses id
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  avatar?: string;
  verified: boolean;
  designerId?: string; // For tailors - references the designer who created them
  createdAt: string;
  updatedAt: string;
}

export interface Tailor extends User {
  role: UserRole.TAILOR;
  designerId: string;
  profileImage?: string;
  orderStats?: {
    total: number;
    processing: number;
    completed: number;
  };
  isPendingInvitation?: boolean;
  expiresAt?: string;
  accountStatus?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  tags: string[];
  designer: {
    id: string;
    name: string;
    rating: number;
  };
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  inStock: boolean;
  stockQuantity?: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
  customizable?: boolean;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface MeasurementData {
  chest?: number;
  waist?: number;
  hips?: number;
  shoulder?: number;
  sleeve?: number;
  inseam?: number;
  neckline?: number;
  bust?: number;
  underbust?: number;
  height?: number;
  weight?: number;
  units: 'cm' | 'inches';
  other?: Record<string, number>;
}
 