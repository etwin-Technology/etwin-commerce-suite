// Mock data layer used until VITE_PHP_API_BASE is set.
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

const KEY = "etwin_mock_db_v2";

interface DB {
  users: (User & { password: string; storeId: string })[];
  stores: Store[];
  products: Product[];
  orders: Order[];
  customers: Customer[];
}

const DEMO_TENANT = "store-demo";
const seedDB = (): DB => {
  const now = Date.now();
  return {
    users: [
      {
        id: "user-demo",
        email: "demo@etwin.app",
        fullName: "Youssef Bennani",
        password: "demo1234",
        storeId: DEMO_TENANT,
      },
    ],
    stores: [
      {
        id: DEMO_TENANT,
        name: "Atlas Watches",
        slug: "atlas-watches",
        ownerId: "user-demo",
        currency: "MAD",
        city: "Tanger",
        logoUrl: null,
        notifications: { whatsappNumber: "+212612345678", telegramChatId: null },
        tracking: { facebookPixel: null, tiktokPixel: null },
        onboardingComplete: true,
        subscription: {
          plan: "trial",
          expiresAt: new Date(now + 14 * 86400000).toISOString(),
          active: true,
        },
      },
    ],
    products: [
      {
        id: "p-1",
        tenantId: DEMO_TENANT,
        name: "Montre Atlas Classic",
        description: "Montre élégante en cuir véritable. Mouvement quartz japonais. Garantie 1 an.",
        price: 299,
        originalPrice: 450,
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80",
        extraImages: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=900&q=80",
        ],
        stock: 4,
        status: "active",
        createdAt: new Date(now - 86400000).toISOString(),
      },
      {
        id: "p-2",
        tenantId: DEMO_TENANT,
        name: "Bracelet cuir naturel",
        description: "Bracelet en cuir tressé fait main. Trois couleurs disponibles.",
        price: 89,
        originalPrice: 149,
        image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=80",
        stock: 18,
        status: "active",
        createdAt: new Date(now - 2 * 86400000).toISOString(),
      },
      {
        id: "p-3",
        tenantId: DEMO_TENANT,
        name: "Lunettes de soleil Sahara",
        description: "Verres polarisés UV400. Monture en acétate italien.",
        price: 179,
        originalPrice: 280,
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80",
        stock: 7,
        status: "active",
        createdAt: new Date(now - 3 * 86400000).toISOString(),
      },
    ],
    orders: Array.from({ length: 6 }).map((_, i) => ({
      id: `${1520 + i}`,
      tenantId: DEMO_TENANT,
      customerName: ["Mohamed", "Fatima", "Karim", "Sara", "Idris", "Nadia"][i],
      customerPhone: `+21266${1000000 + i * 12345}`,
      city: ["Rabat", "Casablanca", "Tanger", "Fès", "Marrakech", "Agadir"][i],
      total: [299, 89, 179, 388, 299, 268][i],
      status: (["pending", "pending", "paid", "shipped", "paid", "pending"] as const)[i],
      items: [],
      createdAt: new Date(now - i * 5400000).toISOString(),
    })),
    customers: [
      { id: "c1", tenantId: DEMO_TENANT, name: "Mohamed Alami", phone: "+212661234567", address: "Hay Riad, Rabat", ordersCount: 3, totalSpent: 887 },
      { id: "c2", tenantId: DEMO_TENANT, name: "Fatima Zahra", phone: "+212677889900", address: "Maarif, Casablanca", ordersCount: 2, totalSpent: 478 },
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

const sleep = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "store";

export const mockApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    await sleep();
    const db = load();
    const user = db.users.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error("Email ou mot de passe incorrect");
    const store = db.stores.find((s) => s.id === user.storeId)!;
    const { password: _pw, storeId: _sid, ...safeUser } = user;
    return { token: `mock.${user.id}.${Date.now()}`, user: safeUser, store };
  },

  async register(input: { email: string; password: string; fullName: string; storeName: string }): Promise<AuthResponse> {
    await sleep();
    const db = load();
    if (db.users.some((u) => u.email === input.email)) throw new Error("Cet email est déjà utilisé");
    const userId = `user-${Date.now()}`;
    const tenantId = `store-${Date.now()}`;
    const slugBase = slugify(input.storeName || input.fullName || "store");
    let slug = slugBase;
    let n = 1;
    while (db.stores.some((s) => s.slug === slug)) slug = `${slugBase}-${++n}`;
    const store: Store = {
      id: tenantId,
      name: input.storeName || `${input.fullName.split(" ")[0]}'s Store`,
      slug,
      ownerId: userId,
      currency: "MAD",
      city: "",
      logoUrl: null,
      notifications: { whatsappNumber: "", telegramChatId: null },
      tracking: { facebookPixel: null, tiktokPixel: null },
      onboardingComplete: false,
      subscription: {
        plan: "trial",
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
        active: true,
      },
    };
    db.users.push({ ...input, id: userId, storeId: tenantId });
    db.stores.push(store);
    save(db);
    return { token: `mock.${userId}.${Date.now()}`, user: { id: userId, email: input.email, fullName: input.fullName }, store };
  },

  async updateStore(tenantId: string, patch: Partial<Store>): Promise<Store> {
    await sleep(150);
    const db = load();
    const idx = db.stores.findIndex((s) => s.id === tenantId);
    if (idx < 0) throw new Error("Boutique introuvable");
    db.stores[idx] = { ...db.stores[idx], ...patch, notifications: { ...db.stores[idx].notifications, ...(patch.notifications || {}) }, tracking: { ...db.stores[idx].tracking, ...(patch.tracking || {}) } };
    save(db);
    return db.stores[idx];
  },

  async getStoreBySlug(slug: string): Promise<Store | null> {
    await sleep(100);
    return load().stores.find((s) => s.slug === slug) ?? null;
  },

  async listProducts(tenantId: string): Promise<Product[]> {
    await sleep(100);
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
    if (idx < 0) throw new Error("Produit introuvable");
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
    await sleep(100);
    return load().orders.filter((o) => o.tenantId === tenantId);
  },

  async listCustomers(tenantId: string): Promise<Customer[]> {
    await sleep(100);
    return load().customers.filter((c) => c.tenantId === tenantId);
  },

  async dashboardStats(tenantId: string): Promise<DashboardStats> {
    await sleep(150);
    const db = load();
    const orders = db.orders.filter((o) => o.tenantId === tenantId);
    const products = db.products.filter((p) => p.tenantId === tenantId);
    const customers = db.customers.filter((c) => c.tenantId === tenantId).length;
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const today = new Date().toDateString();
    const todayRevenue = orders.filter((o) => new Date(o.createdAt).toDateString() === today).reduce((s, o) => s + o.total, 0);
    const newOrders = orders.filter((o) => Date.now() - new Date(o.createdAt).getTime() < 86400000).length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const days = ["Sa", "Di", "Lu", "Ma", "Me", "Je", "Ve"];
    return {
      revenue,
      ordersCount: orders.length,
      customersCount: customers,
      conversion: 2.84,
      revenueDelta: 12.4,
      ordersDelta: 5.2,
      customersDelta: 10.5,
      conversionDelta: 0.3,
      todayRevenue,
      newOrdersCount: newOrders,
      pendingCount: pending,
      bestSeller: products[0] ? { name: products[0].name, sales: orders.length } : null,
      salesByDay: days.map((day, i) => ({ day, value: Math.round(400 + Math.sin(i * 1.2) * 250 + i * 80) })),
    };
  },

  async createOrderFromCart(
    tenantId: string,
    payload: { customerName: string; phone: string; address?: string; city?: string; items: { productId: string; qty: number }[] },
  ): Promise<Order> {
    await sleep();
    const db = load();
    const products = db.products.filter((p) => p.tenantId === tenantId);
    const items = payload.items.map((it) => {
      const p = products.find((x) => x.id === it.productId)!;
      return { productId: p.id, name: p.name, qty: it.qty, price: p.price };
    });
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    const order: Order = {
      id: `${1500 + db.orders.length + 1}`,
      tenantId,
      customerName: payload.customerName,
      customerPhone: payload.phone,
      customerAddress: payload.address,
      city: payload.city,
      total,
      status: "pending",
      items,
      createdAt: new Date().toISOString(),
    };
    db.orders.unshift(order);
    save(db);
    return order;
  },

  async confirmOrder(tenantId: string, id: string): Promise<Order> {
    await sleep(100);
    const db = load();
    const idx = db.orders.findIndex((o) => o.id === id && o.tenantId === tenantId);
    if (idx < 0) throw new Error("Commande introuvable");
    db.orders[idx] = { ...db.orders[idx], status: "paid" };
    save(db);
    return db.orders[idx];
  },
};
