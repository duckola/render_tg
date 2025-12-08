export interface User {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  schoolId: string;
  createdAt: string;
  roleName: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface LoginRequest {
  schoolId: string;
  password: string;
}

export interface SignUpRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  schoolId: string;
}

export interface MenuItem {
  itemId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  canteenId?: number;
  categoryId?: number;
  isAvailable: boolean;
  createdAt?: string;
}

export interface Category {
  categoryId: number;
  categoryName: string;
  itemCount?: number;
}

export interface CartItem {
  cartItemId: number;
  itemId: number;
  quantity: number;
  note?: string;
  addedAt?: string;
  menuItem?: MenuItem;
}

export interface Cart {
  cartId: number;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
  cartItems?: CartItem[];
  items?: CartItem[]; // Alias for cartItems for backward compatibility
}

export interface Order {
  orderId: number;
  userId: number;
  user?: {
    fullName: string;
    schoolId: string;
  };
  status: string;
  isPreorder: boolean;
  takeout: boolean;
  orderTime: string;
  pickupTime?: string;
  totalPrice: number;
  paymentMethod?: string;
  note?: string;
  items?: OrderItem[];
  orderItems?: OrderItem[]; // Backend uses orderItems, frontend may use items
}

export interface OrderItem {
  orderItemId: number;
  orderId: number;
  itemId: number;
  quantity: number;
  priceAtOrder: number;
  subtotalPrice: number;
  note?: string;
  menuItem?: MenuItem;
}

export interface Payment {
  paymentId: number;
  orderId: number;
  amount: number;
  status: string;
  transactionRef?: string;
  paymentTime: string;
}

export interface PaymentMethod {
  paymentMethodId: number;
  userId: number;
  methodType: string;
  maskedDetails?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Inventory {
  inventoryId: number;
  itemId: number;
  itemName: string;
  currentStock: number;
  thresholdLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface Notification {
  notificationId: number;
  userId: number;
  message: string;
  type?: string;
  timestamp: string;
  isRead: boolean;
}

export interface Canteen {
  canteenId: number;
  name: string;
  location?: string;
  contactInfo?: string;
}

