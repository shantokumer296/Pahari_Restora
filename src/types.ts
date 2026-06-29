export interface Profile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  emailVerified: boolean;
  isBanned: boolean;
  createdAt: string;
  passwordHash?: string;
  salt?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface CartItem extends FoodItem {
  qty: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'On the Way' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  userMobile: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount?: number;
  appliedCoupon?: string;
  deliveryAddress: string;
  status: OrderStatus;
  paymentMethod?: 'bKash' | 'Cash on Delivery';
  bkashNumber?: string;
  transactionId?: string;
  adminResponse?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  expiryDate: string; // ISO Date String (e.g. YYYY-MM-DD)
  minOrderAmount: number;
  usageLimit: number;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  message: string;
  adminResponse?: string;
  createdAt: string;
}
