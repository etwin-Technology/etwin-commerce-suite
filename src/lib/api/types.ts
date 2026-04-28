// Shared types for the ETWIN Commerce REST client.
// Mirror the contract expected from the PHP backend.

export type Plan = "trial" | "pro";
export type Currency = "MAD" | "EUR" | "USD";
export type ProductStatus = "active" | "draft" | "archived";
export type OrderStatus = "pending" | "paid" | "shipped";

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface Subscription {
  plan: Plan;
  expiresAt: string;
  active: boolean;
}

export interface StoreNotifications {
  whatsappNumber: string;
  telegramChatId?: string | null;
}

export interface StoreTracking {
  facebookPixel?: string | null;
  tiktokPixel?: string | null;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  currency: Currency;
  city: string;
  logoUrl?: string | null;
  notifications: StoreNotifications;
  tracking: StoreTracking;
  onboardingComplete: boolean;
  subscription: Subscription;
}

export interface AuthResponse {
  token: string;
  user: User;
  store: Store;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  extraImages?: string[];
  videoUrl?: string | null;
  stock: number;
  status: ProductStatus;
  createdAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  tenantId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  city?: string;
  customerId?: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
}

export interface DashboardStats {
  revenue: number;
  ordersCount: number;
  customersCount: number;
  conversion: number;
  revenueDelta: number;
  ordersDelta: number;
  customersDelta: number;
  conversionDelta: number;
  todayRevenue: number;
  newOrdersCount: number;
  pendingCount: number;
  bestSeller?: { name: string; sales: number } | null;
  salesByDay: { day: string; value: number }[];
}
