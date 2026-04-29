// Shared types for the ETWIN Commerce REST client.
// Mirror the contract expected from the PHP backend.

export type Plan = "trial" | "pro";
export type Currency = "MAD" | "EUR" | "USD";
export type ProductStatus = "active" | "draft" | "archived";
export type OrderStatus = "pending" | "paid" | "shipped";
export type NotificationType = "order" | "system" | "payment" | "domain";

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  isAdmin?: boolean;
}

// ─── Subscription ────────────────────────────────────────────────────────────

export interface Subscription {
  plan: Plan;
  expiresAt: string;
  active: boolean;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export interface StoreNotifications {
  whatsappNumber: string;
  telegramChatId?: string | null;
}

export interface StoreTracking {
  facebookPixel?: string | null;
  tiktokPixel?: string | null;
}

export interface StoreTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: "sm" | "md" | "lg" | "xl" | "full";
  darkMode?: boolean;
}

export interface MenuLink {
  label: string;
  url: string;
}

export interface StoreHeader {
  logoUrl?: string | null;
  menuLinks: MenuLink[];
  showSearch: boolean;
  announcementBar?: boolean;
  announcementText?: string;
}

export interface StoreSocials {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

export interface StoreFooter {
  description?: string;
  links: MenuLink[];
  socials: StoreSocials;
  showPoweredBy?: boolean;
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
  theme: StoreTheme;
  header: StoreHeader;
  footer: StoreFooter;
  customDomain?: string | null;
  domainVerified?: boolean;
  onboardingComplete: boolean;
  subscription: Subscription;
}

export interface AuthResponse {
  token: string;
  user: User;
  store: Store;
}

// ─── Products ────────────────────────────────────────────────────────────────

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

// ─── Customers ───────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

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
  notes?: string | null;
  items: OrderItem[];
  createdAt: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

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

// ─── Notifications ───────────────────────────────────────────────────────────

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  refId?: string | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Domain ──────────────────────────────────────────────────────────────────

export interface DomainInfo {
  domain: string | null;
  verified: boolean;
  verifiedAt?: string | null;
  serverIp: string;
  instructions: Array<{
    type: string;
    host: string;
    value: string;
    ttl: number;
    comment: string;
  }>;
}

// ─── Subscription Plans ──────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency?: string;
  duration: string;
  features: string[];
  recommended?: boolean;
}

export interface SubscriptionHistory {
  id: number;
  plan: Plan;
  amount: number;
  startedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "cancelled";
}

export interface SubscriptionInfo {
  plan: Plan;
  active: boolean;
  expiresAt: string;
  daysLeft: number;
  expired: boolean;
  plans: SubscriptionPlan[];
  history: SubscriptionHistory[];
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalStores: number;
  activeSubs: number;
  proSubs: number;
  trialSubs: number;
  expiredSubs: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyMrr: number;
  newUsers7d: number;
  userGrowth: { day: string; value: number }[];
}

export interface AdminUserStore {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  expiresAt: string;
  active: boolean;
  customDomain?: string | null;
  orderCount: number;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  createdAt: string;
  store: AdminUserStore | null;
}

export interface AdminStore {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
  plan: Plan;
  expiresAt: string;
  active: boolean;
  customDomain?: string | null;
  domainVerified: boolean;
  orderCount: number;
  productCount: number;
  createdAt: string;
}

export interface AdminDomain {
  storeId: string;
  storeName: string;
  storeSlug: string;
  domain: string;
  verified: boolean;
  verifiedAt?: string | null;
  ownerEmail: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pages: number;
  items: T[];
}
