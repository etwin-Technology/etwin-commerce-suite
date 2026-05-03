// REST client. Set VITE_PHP_API_BASE to swap mock for live PHP backend.
import { mockApi } from "./mock";
import type {
  AdminDomain,
  AdminStats,
  AdminStore,
  AdminUser,
  AppNotification,
  AuthResponse,
  Customer,
  DashboardStats,
  DomainInfo,
  Order,
  PaginatedResponse,
  PlanFeature,
  PlatformSettings,
  Product,
  Store,
  StoreFooter,
  StoreHeader,
  StoreTheme,
  SubscriptionInfo,
  UserRole,
} from "./types";

const API_BASE = (import.meta.env.VITE_PHP_API_BASE as string | undefined)?.replace(/\/$/, "") || "";
const TOKEN_KEY  = "etwin_token";
const TENANT_KEY = "etwin_tenant_id";

export const useMockApi = () => API_BASE === "";

export function setAuthToken(token: string | null) {
  if (typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getAuthToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setTenantId(tenantId: string | null) {
  if (typeof localStorage === "undefined") return;
  if (tenantId) localStorage.setItem(TENANT_KEY, tenantId);
  else localStorage.removeItem(TENANT_KEY);
}
export function getTenantId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TENANT_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token    = getAuthToken();
  const tenantId = getTenantId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token)    headers["Authorization"] = `Bearer ${token}`;
  if (tenantId) headers["X-Tenant-Id"]  = tenantId;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.message || body?.error || msg;
    } catch { /* noop */ }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // ─── Auth ───────────────────────────────────────────────────────────────
  login: (email: string, password: string): Promise<AuthResponse> =>
    useMockApi()
      ? mockApi.login(email, password)
      : request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  register: (input: { email: string; password: string; fullName: string; storeName: string }): Promise<AuthResponse> =>
    useMockApi()
      ? mockApi.register(input)
      : request("/api/auth/register", { method: "POST", body: JSON.stringify(input) }),

  // ─── Stores ─────────────────────────────────────────────────────────────
  updateStore: (tenantId: string, patch: Partial<Store>): Promise<Store> =>
    useMockApi()
      ? mockApi.updateStore(tenantId, patch)
      : request(`/api/stores/${tenantId}`, { method: "PATCH", body: JSON.stringify(patch) }),

  getStoreBySlug: (slug: string): Promise<Store | null> =>
    useMockApi()
      ? mockApi.getStoreBySlug(slug)
      : request(`/api/stores/${encodeURIComponent(slug)}`),

  updateTheme: (storeId: string, theme: Partial<StoreTheme>): Promise<Store> =>
    request(`/api/stores/${storeId}/theme`, { method: "PATCH", body: JSON.stringify(theme) }),

  updateHeader: (storeId: string, header: Partial<StoreHeader>): Promise<Store> =>
    request(`/api/stores/${storeId}/header`, { method: "PATCH", body: JSON.stringify(header) }),

  updateFooter: (storeId: string, footer: Partial<StoreFooter>): Promise<Store> =>
    request(`/api/stores/${storeId}/footer`, { method: "PATCH", body: JSON.stringify(footer) }),

  // ─── Products ───────────────────────────────────────────────────────────
  listProducts: (tenantId: string): Promise<Product[]> =>
    useMockApi()
      ? mockApi.listProducts(tenantId)
      : request(`/api/products`),

  createProduct: (tenantId: string, input: Omit<Product, "id" | "tenantId" | "createdAt">): Promise<Product> =>
    useMockApi()
      ? mockApi.createProduct(tenantId, input)
      : request(`/api/products`, { method: "POST", body: JSON.stringify(input) }),

  updateProduct: (tenantId: string, id: string, patch: Partial<Product>): Promise<Product> =>
    useMockApi()
      ? mockApi.updateProduct(tenantId, id, patch)
      : request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(patch) }),

  deleteProduct: (tenantId: string, id: string): Promise<void> =>
    useMockApi()
      ? mockApi.deleteProduct(tenantId, id)
      : request(`/api/products/${id}`, { method: "DELETE" }),

  listPublicProducts: (slug: string): Promise<Product[]> =>
    request(`/api/public/stores/${encodeURIComponent(slug)}/products`),

  // ─── Orders ─────────────────────────────────────────────────────────────
  listOrders: (tenantId: string, params?: { status?: string; page?: number }): Promise<Order[]> => {
    if (useMockApi()) return mockApi.listOrders(tenantId);
    const qs = params?.status ? `?status=${params.status}` : "";
    return request(`/api/orders${qs}`);
  },

  createOrderFromCart: (
    tenantId: string,
    payload: { customerName: string; phone: string; address?: string; city?: string; notes?: string; items: { productId: string; qty: number }[] },
  ): Promise<Order> =>
    useMockApi()
      ? mockApi.createOrderFromCart(tenantId, payload)
      : request(`/api/public/stores/${tenantId}/orders`, { method: "POST", body: JSON.stringify(payload) }),

  confirmOrder: (tenantId: string, id: string): Promise<Order> =>
    useMockApi()
      ? mockApi.confirmOrder(tenantId, id)
      : request(`/api/orders/${id}/confirm`, { method: "POST" }),

  shipOrder: (id: string): Promise<Order> =>
    request(`/api/orders/${id}/ship`, { method: "POST" }),

  updateOrderStatus: (id: string, status: string): Promise<Order> =>
    request(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // ─── Orders extras ───────────────────────────────────────────────────────
  updateOrder: (tenantId: string, id: string, patch: Partial<Order>): Promise<Order> =>
    useMockApi()
      ? mockApi.updateOrder(tenantId, id, patch)
      : request(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  deleteOrder: (tenantId: string, id: string): Promise<void> =>
    useMockApi()
      ? mockApi.deleteOrder(tenantId, id)
      : request(`/api/orders/${id}`, { method: "DELETE" }),

  // ─── Customers ──────────────────────────────────────────────────────────
  listCustomers: (tenantId: string): Promise<Customer[]> =>
    useMockApi()
      ? mockApi.listCustomers(tenantId)
      : request(`/api/customers`),

  createCustomer: (tenantId: string, input: Omit<Customer, "id" | "tenantId" | "ordersCount" | "totalSpent">): Promise<Customer> =>
    useMockApi()
      ? mockApi.createCustomer(tenantId, input)
      : request(`/api/customers`, { method: "POST", body: JSON.stringify(input) }),

  updateCustomer: (tenantId: string, id: string, patch: Partial<Customer>): Promise<Customer> =>
    useMockApi()
      ? mockApi.updateCustomer(tenantId, id, patch)
      : request(`/api/customers/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  deleteCustomer: (tenantId: string, id: string): Promise<void> =>
    useMockApi()
      ? mockApi.deleteCustomer(tenantId, id)
      : request(`/api/customers/${id}`, { method: "DELETE" }),

  // ─── Dashboard ──────────────────────────────────────────────────────────
  dashboardStats: (tenantId: string): Promise<DashboardStats> =>
    useMockApi()
      ? mockApi.dashboardStats(tenantId)
      : request(`/api/dashboard/stats`),

  // ─── Notifications ───────────────────────────────────────────────────────
  listNotifications: (): Promise<AppNotification[]> =>
    request(`/api/notifications`),

  unreadCount: (): Promise<{ count: number }> =>
    request(`/api/notifications/unread`),

  markAllRead: (): Promise<{ ok: boolean }> =>
    request(`/api/notifications/read-all`, { method: "POST" }),

  markOneRead: (id: number): Promise<{ ok: boolean }> =>
    request(`/api/notifications/${id}/read`, { method: "POST" }),

  // ─── Domain ──────────────────────────────────────────────────────────────
  getDomain: (): Promise<DomainInfo> =>
    request(`/api/domain`),

  setDomain: (domain: string): Promise<DomainInfo> =>
    request(`/api/domain`, { method: "POST", body: JSON.stringify({ domain }) }),

  removeDomain: (): Promise<{ ok: boolean }> =>
    request(`/api/domain`, { method: "DELETE" }),

  checkDomain: (): Promise<{ domain: string; resolved: string | null; expected: string; verified: boolean }> =>
    request(`/api/domain/check`, { method: "POST" }),

  // ─── Subscription ────────────────────────────────────────────────────────
  getSubscription: (): Promise<SubscriptionInfo> =>
    request(`/api/subscription`),

  upgradeSubscription: (plan: "pro"): Promise<{ ok: boolean; plan: string; expiresAt: string }> =>
    request(`/api/subscription/upgrade`, { method: "POST", body: JSON.stringify({ plan }) }),

  // ─── Admin — Stats & Lists ───────────────────────────────────────────────
  adminStats: (): Promise<AdminStats> =>
    useMockApi() ? mockApi.adminStats() : request(`/api/admin/stats`),

  adminUsers: (params?: { page?: number; q?: string; role?: string }): Promise<PaginatedResponse<AdminUser>> => {
    if (useMockApi()) return mockApi.adminUsers(params);
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.q)    qs.set("q", params.q);
    if (params?.role) qs.set("role", params.role);
    return request(`/api/admin/users?${qs.toString()}`);
  },

  adminStores: (params?: { page?: number; q?: string; plan?: string }): Promise<PaginatedResponse<AdminStore>> => {
    if (useMockApi()) return mockApi.adminStores(params);
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.q)    qs.set("q", params.q);
    if (params?.plan) qs.set("plan", params.plan);
    return request(`/api/admin/stores?${qs.toString()}`);
  },

  adminDomains: (): Promise<AdminDomain[]> =>
    request(`/api/admin/domains`),

  adminSuspendUser: (userId: string): Promise<{ ok: boolean }> =>
    request(`/api/admin/users/${userId}/suspend`, { method: "POST" }),

  adminDeleteUser: (userId: string): Promise<{ ok: boolean }> =>
    request(`/api/admin/users/${userId}/delete`, { method: "POST" }),

  adminUpdateUserRole: (userId: string, role: UserRole): Promise<{ ok: boolean; role: UserRole }> =>
    request(`/api/admin/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),

  adminUpdatePlan: (storeId: string, plan: string, months?: number): Promise<{ ok: boolean; plan: string; expiresAt: string }> =>
    request(`/api/admin/stores/${storeId}/plan`, { method: "PATCH", body: JSON.stringify({ plan, months: months ?? 1 }) }),

  adminSuspendStore: (storeId: string, reason?: string): Promise<{ ok: boolean; suspended: boolean }> =>
    request(`/api/admin/stores/${storeId}/suspend`, { method: "POST", body: JSON.stringify({ reason: reason ?? null }) }),

  adminVerifyDomain: (storeId: string): Promise<{ ok: boolean }> =>
    request(`/api/admin/domains/${storeId}/verify`, { method: "POST" }),

  adminRevokeDomain: (storeId: string): Promise<{ ok: boolean }> =>
    request(`/api/admin/domains/${storeId}/revoke`, { method: "POST" }),

  // ─── Admin — Platform Settings (super_admin) ─────────────────────────────
  adminGetSettings: (): Promise<PlatformSettings> =>
    useMockApi() ? mockApi.adminGetSettings() : request(`/api/admin/settings`),

  adminUpdateSettings: (patch: Partial<PlatformSettings>): Promise<{ ok: boolean }> =>
    useMockApi()
      ? mockApi.adminUpdateSettings(patch)
      : request(`/api/admin/settings`, { method: "PATCH", body: JSON.stringify(patch) }),

  adminGetPlanFeatures: (): Promise<PlanFeature[]> =>
    useMockApi() ? mockApi.adminGetPlanFeatures() : request(`/api/admin/plan-features`),

  adminUpdatePlanFeature: (feature: string, patch: { minPlan?: string; trialLimit?: number }): Promise<{ ok: boolean }> =>
    request(`/api/admin/plan-features/${feature}`, { method: "PATCH", body: JSON.stringify(patch) }),

  // Public platform settings (no auth required — for landing page)
  publicSettings: (): Promise<Partial<PlatformSettings>> =>
    useMockApi() ? mockApi.publicSettings() : request(`/api/public/settings`),

  // ─── Team members (real backend) ─────────────────────────────────────────
  listMembers: (): Promise<import("./types").StoreMemberDTO[]> =>
    useMockApi() ? Promise.resolve([]) : request(`/api/members`),
  createMember: (input: { email: string; fullName: string; role: string; permissions: Record<string, boolean> }): Promise<import("./types").StoreMemberDTO> =>
    request(`/api/members`, { method: "POST", body: JSON.stringify(input) }),
  updateMember: (id: string, patch: Partial<{ role: string; permissions: Record<string, boolean>; active: boolean; fullName: string }>): Promise<import("./types").StoreMemberDTO> =>
    request(`/api/members/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteMember: (id: string): Promise<{ ok: boolean }> =>
    request(`/api/members/${id}`, { method: "DELETE" }),
};
