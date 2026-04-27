// Shared types for the ETWIN Commerce REST client.
// These mirror the contract expected from the PHP backend.

export type Plan = "trial" | "basic" | "pro";
export type Currency = "USD" | "EUR" | "MAD";
export type ProductStatus = "active" | "draft" | "archived";
export type OrderStatus = "pending" | "paid" | "shipped";

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface Subscription {
  plan: Plan;
  expiresAt: string; // ISO
  active: boolean;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  currency: Currency;
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
  image: string;
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
  salesByDay: { day: string; value: number }[];
}
