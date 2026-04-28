// REST client. Set VITE_PHP_API_BASE to swap mock for live PHP backend.
import { mockApi } from "./mock";
import type {
  AuthResponse,
  Customer,
  DashboardStats,
  Order,
  Product,
  Store,
} from "./types";

const API_BASE = (import.meta.env.VITE_PHP_API_BASE as string | undefined)?.replace(/\/$/, "") || "";
const TOKEN_KEY = "etwin_token";
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
  const token = getAuthToken();
  const tenantId = getTenantId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (tenantId) headers["X-Tenant-Id"] = tenantId;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.message || body?.error || msg;
    } catch {/* noop */}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  login: (email: string, password: string): Promise<AuthResponse> =>
    useMockApi() ? mockApi.login(email, password) : request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  register: (input: { email: string; password: string; fullName: string; storeName: string }): Promise<AuthResponse> =>
    useMockApi() ? mockApi.register(input) : request("/api/auth/register", { method: "POST", body: JSON.stringify(input) }),

  updateStore: (tenantId: string, patch: Partial<Store>): Promise<Store> =>
    useMockApi() ? mockApi.updateStore(tenantId, patch) : request(`/api/stores/${tenantId}`, { method: "PATCH", body: JSON.stringify(patch) }),

  getStoreBySlug: (slug: string): Promise<Store | null> =>
    useMockApi() ? mockApi.getStoreBySlug(slug) : request(`/api/stores/${encodeURIComponent(slug)}`),

  listProducts: (tenantId: string): Promise<Product[]> =>
    useMockApi() ? mockApi.listProducts(tenantId) : request(`/api/products`),

  createProduct: (tenantId: string, input: Omit<Product, "id" | "tenantId" | "createdAt">): Promise<Product> =>
    useMockApi() ? mockApi.createProduct(tenantId, input) : request(`/api/products`, { method: "POST", body: JSON.stringify(input) }),

  updateProduct: (tenantId: string, id: string, patch: Partial<Product>): Promise<Product> =>
    useMockApi() ? mockApi.updateProduct(tenantId, id, patch) : request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(patch) }),

  deleteProduct: (tenantId: string, id: string): Promise<void> =>
    useMockApi() ? mockApi.deleteProduct(tenantId, id) : request(`/api/products/${id}`, { method: "DELETE" }),

  listOrders: (tenantId: string): Promise<Order[]> =>
    useMockApi() ? mockApi.listOrders(tenantId) : request(`/api/orders`),
  listCustomers: (tenantId: string): Promise<Customer[]> =>
    useMockApi() ? mockApi.listCustomers(tenantId) : request(`/api/customers`),

  dashboardStats: (tenantId: string): Promise<DashboardStats> =>
    useMockApi() ? mockApi.dashboardStats(tenantId) : request(`/api/dashboard/stats`),

  createOrderFromCart: (tenantId: string, payload: { customerName: string; phone: string; address?: string; city?: string; items: { productId: string; qty: number }[] }): Promise<Order> =>
    useMockApi() ? mockApi.createOrderFromCart(tenantId, payload) : request(`/api/orders`, { method: "POST", body: JSON.stringify(payload) }),

  confirmOrder: (tenantId: string, id: string): Promise<Order> =>
    useMockApi() ? mockApi.confirmOrder(tenantId, id) : request(`/api/orders/${id}/confirm`, { method: "POST" }),
};
