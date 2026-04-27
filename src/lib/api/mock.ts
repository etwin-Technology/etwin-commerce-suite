// Mock data layer used until the PHP API base URL is configured.
// Persisted in localStorage to feel real across reloads.

import type {
  AuthResponse,
  Customer,
  DashboardStats,
  Order,
  Product,
  Store,
  User,
} from "./types";

const KEY = "etwin_mock_db_v1";

interface DB {
  users: (User & { password: string; storeId: string })[];
  stores: Store[];
  products: Product[];
  orders: Order[];
  customers: Customer[];
}

const seedDB = (): DB => {
  const tenantId = "store-demo";
  const now = Date.now();
  return {
    users: [
      {
        id: "user-demo",
        email: "demo@etwin.app",
        fullName: "Demo Merchant",
        password: "demo1234",
        storeId: tenantId,
      },
    ],
    stores: [
      {
        id: tenantId,
        name: "Atelier Lumière",
        slug: "atelier-lumiere",
        ownerId: "user-demo",
        currency: "EUR",
        subscription: {
          plan: "trial",
          expiresAt: new Date(now + 7 * 86400000).toISOString(),
          active: true,
        },
      },
    ],
    products: Array.from({ length: 6 }).map((_, i) => ({
      id: `p-${i + 1}`,
      tenantId,
      name: ["Lampe Halo", "Vase Onyx", "Coussin Lin", "Plateau Marbre", "Bougie Cèdre", "Miroir Arc"][i],
      description: "Pièce signature, fabriquée à la main avec des matériaux nobles.",
      price: [89, 64, 42, 120, 28, 175][i],
      image: `https://images.unsplash.com/photo-${[
        "1505740420928-5e560c06d30e",
        "1513519245088-0e12902e5a38",
        "1493663284031-b7e3aefcae8e",
        "1556909114-f6e7ad7d3136",
        "1602874801007-bd458bb1b8b6",
        "1493663284031-b7e3aefcae8e",
      ][i]}?auto=format&fit=crop&w=800&q=80`,
      stock: [12, 5, 30, 8, 45, 3][i],
      status: "active",
      createdAt: new Date(now - i * 86400000).toISOString(),
    })),
    orders: Array.from({ length: 8 }).map((_, i) => ({
      id: `ord-${1040 + i}`,
      tenantId,
      customerName: ["Anya Petrova", "Ben Carter", "Chloé Davis", "David Lee", "Yasmine A.", "Karim B.", "Sophie M.", "Idris F."][i],
      total: [89.99, 152.5, 45, 210.75, 64, 312, 88.4, 175][i],
      status: (["paid", "pending", "shipped", "paid", "paid", "shipped", "pending", "paid"] as const)[i],
      items: [],
      createdAt: new Date(now - i * 7200000).toISOString(),
    })),
    customers: [
      { id: "c1", tenantId, name: "Anya Petrova", phone: "+33 6 12 34 56 78", address: "12 rue Lafayette, Paris", ordersCount: 3, totalSpent: 412 },
      { id: "c2", tenantId, name: "Karim Benali", phone: "+212 6 11 22 33 44", address: "Bd Zerktouni, Casablanca", ordersCount: 5, totalSpent: 890 },
      { id: "c3", tenantId, name: "Sophie Marin", phone: "+33 7 88 99 00 11", address: "5 quai de Seine, Lyon", ordersCount: 2, totalSpent: 188 },
    ],
  };
};

const load = (): DB => {
  if (typeof localStorage === "undefined") return seedDB();
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const db = seedDB();
    localStorage.setItem(KEY, JSON.stringify(db));
    return db;
  }
  try {
    return JSON.parse(raw) as DB;
  } catch {
    const db = seedDB();
    localStorage.setItem(KEY, JSON.stringify(db));
    return db;
  }
};

const save = (db: DB) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(db));
};

const sleep = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "store";

export const mockApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    await sleep();
    const db = load();
    const user = db.users.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error("Invalid email or password");
    const store = db.stores.find((s) => s.id === user.storeId)!;
    const { password: _pw, storeId: _sid, ...safeUser } = user;
    return { token: `mock.${user.id}.${Date.now()}`, user: safeUser, store };
  },

  async register(input: { email: string; password: string; fullName: string; storeName: string }): Promise<AuthResponse> {
    await sleep();
    const db = load();
    if (db.users.some((u) => u.email === input.email)) throw new Error("Email already in use");
    const userId = `user-${Date.now()}`;
    const tenantId = `store-${Date.now()}`;
    const slugBase = slugify(input.storeName);
    let slug = slugBase;
    let n = 1;
    while (db.stores.some((s) => s.slug === slug)) slug = `${slugBase}-${++n}`;
    const store: Store = {
      id: tenantId,
      name: input.storeName,
      slug,
      ownerId: userId,
      currency: "EUR",
      subscription: {
        plan: "trial",
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        active: true,
      },
    };
    db.users.push({ ...input, id: userId, storeId: tenantId });
    db.stores.push(store);
    save(db);
    return { token: `mock.${userId}.${Date.now()}`, user: { id: userId, email: input.email, fullName: input.fullName }, store };
  },

  async getStoreBySlug(slug: string): Promise<Store | null> {
    await sleep(150);
    return load().stores.find((s) => s.slug === slug) ?? null;
  },

  async listProducts(tenantId: string): Promise<Product[]> {
    await sleep(150);
    return load().products.filter((p) => p.tenantId === tenantId);
  },

  async createProduct(tenantId: string, input: Omit<Product, "id" | "tenantId" | "createdAt">): Promise<Product> {
    await sleep();
    const db = load();
    const product: Product = { ...input, id: `p-${Date.now()}`, tenantId, createdAt: new Date().toISOString() };
    db.products.push(product);
    save(db);
    return product;
  },

  async updateProduct(tenantId: string, id: string, patch: Partial<Product>): Promise<Product> {
    await sleep();
    const db = load();
    const idx = db.products.findIndex((p) => p.id === id && p.tenantId === tenantId);
    if (idx < 0) throw new Error("Product not found");
    db.products[idx] = { ...db.products[idx], ...patch };
    save(db);
    return db.products[idx];
  },

  async deleteProduct(tenantId: string, id: string): Promise<void> {
    await sleep();
    const db = load();
    db.products = db.products.filter((p) => !(p.id === id && p.tenantId === tenantId));
    save(db);
  },

  async listOrders(tenantId: string): Promise<Order[]> {
    await sleep(150);
    return load().orders.filter((o) => o.tenantId === tenantId);
  },

  async listCustomers(tenantId: string): Promise<Customer[]> {
    await sleep(150);
    return load().customers.filter((c) => c.tenantId === tenantId);
  },

  async dashboardStats(tenantId: string): Promise<DashboardStats> {
    await sleep(200);
    const db = load();
    const orders = db.orders.filter((o) => o.tenantId === tenantId);
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const customers = db.customers.filter((c) => c.tenantId === tenantId).length;
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    return {
      revenue,
      ordersCount: orders.length,
      customersCount: customers,
      conversion: 2.31,
      revenueDelta: 12.4,
      ordersDelta: 5.2,
      customersDelta: 10.5,
      conversionDelta: -0.1,
      salesByDay: days.map((day, i) => ({ day, value: Math.round(800 + Math.sin(i) * 350 + i * 90) })),
    };
  },

  async createOrderFromCart(tenantId: string, payload: { customerName: string; phone: string; items: { productId: string; qty: number }[] }): Promise<Order> {
    await sleep();
    const db = load();
    const products = db.products.filter((p) => p.tenantId === tenantId);
    const items = payload.items.map((it) => {
      const p = products.find((x) => x.id === it.productId)!;
      return { productId: p.id, name: p.name, qty: it.qty, price: p.price };
    });
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    const order: Order = {
      id: `ord-${Date.now()}`,
      tenantId,
      customerName: payload.customerName,
      total,
      status: "pending",
      items,
      createdAt: new Date().toISOString(),
    };
    db.orders.unshift(order);
    save(db);
    return order;
  },
};
