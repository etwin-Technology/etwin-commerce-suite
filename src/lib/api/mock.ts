/**
 * Mock data layer — used until VITE_PHP_API_BASE is set.
 *
 * Demo accounts (password: demo1234 — checked by string comparison in mock):
 *   demo@etwin.app        → role: user       (regular merchant, trial plan)
 *   admin@etwin.app       → role: admin       (platform admin, pro plan)
 *   superadmin@etwin.app  → role: super_admin (full access, no store required)
 *
 * All data is persisted in localStorage under KEY so it survives page reloads.
 */
import type {
  AdminStats,
  AdminUser,
  AdminStore,
  AuthResponse,
  Customer,
  DashboardStats,
  Order,
  PaginatedResponse,
  PlanFeature,
  PlatformSettings,
  Product,
  Store,
  User,
  UserRole,
} from "./types";

const KEY = "etwin_mock_db_v3";

interface DB {
  users: (User & { password: string; storeId: string | null })[];
  stores: Store[];
  products: Product[];
  orders: Order[];
  customers: Customer[];
  settings: PlatformSettings;
  planFeatures: PlanFeature[];
}

// ─── Default theme / header / footer ─────────────────────────────────────────
const defaultTheme = () => ({
  primaryColor: "#7C3AED",
  secondaryColor: "#F3F0FF",
  accentColor: "#F59E0B",
  fontFamily: "DM Sans",
  borderRadius: "lg" as const,
});

const defaultHeader = () => ({
  logoUrl: null,
  menuLinks: [],
  showSearch: false,
  announcementBar: false,
  announcementText: "",
});

const defaultFooter = () => ({
  description: "La boutique de confiance du Maroc.",
  links: [],
  socials: { facebook: "", instagram: "", tiktok: "", youtube: "" },
  showPoweredBy: true,
});

// ─── Seed ────────────────────────────────────────────────────────────────────
const now = Date.now();

const seedDB = (): DB => ({
  users: [
    // ── Regular merchant (trial) ──────────────────────────────────────────
    {
      id: "demo-user-001",
      email: "demo@etwin.app",
      fullName: "Youssef Bennani",
      role: "user",
      isAdmin: false,
      password: "demo1234",
      storeId: "store-demo-001",
    },
    // ── Platform admin (pro) ─────────────────────────────────────────────
    {
      id: "demo-admin-001",
      email: "admin@etwin.app",
      fullName: "Amina Chakir",
      role: "admin",
      isAdmin: true,
      password: "demo1234",
      storeId: "store-admin-001",
    },
    // ── Super admin (no store required) ──────────────────────────────────
    {
      id: "demo-super-001",
      email: "superadmin@etwin.app",
      fullName: "Mehdi El Fassi",
      role: "super_admin",
      isAdmin: true,
      password: "demo1234",
      storeId: null,
    },
  ],

  stores: [
    // ── Atlas Watches — trial store ───────────────────────────────────────
    {
      id: "store-demo-001",
      name: "Atlas Watches",
      slug: "atlas-watches",
      ownerId: "demo-user-001",
      currency: "MAD",
      city: "Tanger",
      logoUrl: null,
      notifications: { whatsappNumber: "+212612345678", telegramChatId: null },
      tracking: { facebookPixel: null, tiktokPixel: null },
      theme: { ...defaultTheme() },
      header: { ...defaultHeader() },
      footer: { ...defaultFooter() },
      onboardingComplete: true,
      subscription: {
        plan: "trial",
        expiresAt: new Date(now + 14 * 86400000).toISOString(),
        active: true,
      },
    },
    // ── Sahara Boutique — pro store ────────────────────────────────────────
    {
      id: "store-admin-001",
      name: "Sahara Boutique",
      slug: "sahara-boutique",
      ownerId: "demo-admin-001",
      currency: "MAD",
      city: "Casablanca",
      logoUrl: null,
      notifications: { whatsappNumber: "+212661234567", telegramChatId: "tg_admin_demo" },
      tracking: { facebookPixel: "123456789012345", tiktokPixel: null },
      theme: {
        primaryColor: "#DC2626",
        secondaryColor: "#FFF1F0",
        accentColor: "#F59E0B",
        fontFamily: "DM Sans",
        borderRadius: "xl",
      },
      header: { ...defaultHeader() },
      footer: {
        description: "Mode et accessoires du Maroc.",
        links: [{ label: "À propos", url: "#" }],
        socials: { facebook: "saharaboutique", instagram: "saharaboutique", tiktok: "", youtube: "" },
        showPoweredBy: false,
      },
      customDomain: "shop.saharaboutique.ma",
      domainVerified: true,
      onboardingComplete: true,
      subscription: {
        plan: "pro",
        expiresAt: new Date(now + 30 * 86400000).toISOString(),
        active: true,
      },
    },
  ],

  products: [
    // Atlas Watches products (trial: 3 products shown)
    {
      id: "p-1",
      tenantId: "store-demo-001",
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
      tenantId: "store-demo-001",
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
      tenantId: "store-demo-001",
      name: "Lunettes de soleil Sahara",
      description: "Verres polarisés UV400. Monture en acétate italien.",
      price: 179,
      originalPrice: 280,
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80",
      stock: 7,
      status: "active",
      createdAt: new Date(now - 3 * 86400000).toISOString(),
    },
    // Sahara Boutique products (pro: unlimited)
    {
      id: "p-4",
      tenantId: "store-admin-001",
      name: "Caftan Moderne",
      description: "Caftan brodé à la main, disponible en 5 couleurs.",
      price: 650,
      originalPrice: 900,
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80",
      stock: 6,
      status: "active",
      createdAt: new Date(now - 86400000).toISOString(),
    },
  ],

  orders: [
    ...Array.from({ length: 6 }).map((_, i) => ({
      id: `${1520 + i}`,
      tenantId: "store-demo-001",
      customerName: ["Mohamed Alami", "Fatima Zahra", "Karim Benali", "Sara Idrissi", "Idris Tazi", "Nadia Fassi"][i],
      customerPhone: `+21266${1000000 + i * 12345}`,
      customerAddress: ["Hay Riad, Rabat", "Maarif, Casa", "Tanger Centre", "Fès Médina", "Marrakech Hivernage", "Agadir Founty"][i],
      city: ["Rabat", "Casablanca", "Tanger", "Fès", "Marrakech", "Agadir"][i],
      total: [299, 89, 179, 388, 299, 268][i],
      status: (["pending", "pending", "paid", "shipped", "paid", "pending"] as const)[i],
      items: [{ productId: "p-1", name: "Montre Atlas Classic", qty: 1, price: 299 }],
      createdAt: new Date(now - i * 5400000).toISOString(),
    })),
    // Admin store orders
    ...Array.from({ length: 3 }).map((_, i) => ({
      id: `${2100 + i}`,
      tenantId: "store-admin-001",
      customerName: ["Leila Benali", "Omar Kadiri", "Zineb Tazi"][i],
      customerPhone: `+21267${2000000 + i * 9876}`,
      customerAddress: ["Casablanca", "Rabat", "Marrakech"][i],
      city: ["Casablanca", "Rabat", "Marrakech"][i],
      total: [650, 1300, 650][i],
      status: (["paid", "shipped", "pending"] as const)[i],
      items: [{ productId: "p-4", name: "Caftan Moderne", qty: [1, 2, 1][i], price: 650 }],
      createdAt: new Date(now - (i + 1) * 7200000).toISOString(),
    })),
  ],

  customers: [
    { id: "c1", tenantId: "store-demo-001", name: "Mohamed Alami",  phone: "+212661234567", address: "Hay Riad, Rabat",     ordersCount: 3, totalSpent: 887 },
    { id: "c2", tenantId: "store-demo-001", name: "Fatima Zahra",   phone: "+212677889900", address: "Maarif, Casablanca",  ordersCount: 2, totalSpent: 478 },
    { id: "c3", tenantId: "store-demo-001", name: "Karim Benali",   phone: "+212655443322", address: "Tanger Centre",       ordersCount: 1, totalSpent: 179 },
    { id: "c4", tenantId: "store-admin-001", name: "Leila Benali",  phone: "+212670001122", address: "Casablanca",          ordersCount: 1, totalSpent: 650 },
    { id: "c5", tenantId: "store-admin-001", name: "Omar Kadiri",   phone: "+212680002233", address: "Rabat",               ordersCount: 2, totalSpent: 1300 },
  ],

  settings: {
    maintenance_mode: false,
    platform_name: "ETWIN Commerce",
    trial_days: 14,
    max_products_trial: 10,
    pricing_price: 99,
    pricing_currency: "MAD",
    hero_badge_ar: "منصة مغربية #1",
    hero_badge_fr: "Plateforme n°1",
    hero_title_ar: "صاوب متجرك وبدا تبيع دابا",
    hero_title_fr: "Lance ta boutique et vends maintenant",
    hero_subtitle_ar: "منصة مغربية متكاملة لإطلاق متجر أونلاين في 60 ثانية. WhatsApp + COD + Telegram.",
    hero_subtitle_fr: "Plateforme marocaine pour lancer une boutique en 60s. WhatsApp + COD + Telegram.",
    hero_cta_ar: "ابدأ مجاناً — 14 يوم",
    hero_cta_fr: "Commencer gratuitement — 14 jours",
    support_whatsapp: "",
    support_email: "support@etwin.app",
    footer_text_ar: "منصة مغربية لإطلاق متجرك الأونلاين",
    footer_text_fr: "La plateforme marocaine pour votre boutique en ligne",
  },

  planFeatures: [
    { feature: "products",           minPlan: "trial", trialLimit: 10, description: "Max 10 produits en plan Essai" },
    { feature: "custom_domain",      minPlan: "pro",   trialLimit: 0,  description: "Domaine personnalisé" },
    { feature: "telegram_bot",       minPlan: "pro",   trialLimit: 0,  description: "Bot Telegram commandes" },
    { feature: "facebook_pixel",     minPlan: "pro",   trialLimit: 0,  description: "Pixel Facebook & TikTok" },
    { feature: "advanced_analytics", minPlan: "pro",   trialLimit: 0,  description: "Analytics avancés" },
    { feature: "remove_branding",    minPlan: "pro",   trialLimit: 0,  description: "Supprimer la marque ETWIN" },
    { feature: "team_members",       minPlan: "pro",   trialLimit: 0,  description: "Membres d'équipe" },
  ],
});

// ─── Persistence ─────────────────────────────────────────────────────────────
const load = (): DB => {
  if (typeof localStorage === "undefined") return seedDB();
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const db = seedDB();
    localStorage.setItem(KEY, JSON.stringify(db));
    return db;
  }
  try {
    const parsed = JSON.parse(raw) as DB;
    // Ensure new fields exist (rolling upgrade)
    if (!parsed.settings)      parsed.settings      = seedDB().settings;
    if (!parsed.planFeatures)  parsed.planFeatures  = seedDB().planFeatures;
    return parsed;
  } catch {
    const db = seedDB();
    localStorage.setItem(KEY, JSON.stringify(db));
    return db;
  }
};

const persist = (db: DB) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(db));
};

const sleep = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "store";

// ─── Plan helpers ─────────────────────────────────────────────────────────────
function planWeight(p: string) { return p === "pro" ? 2 : 1; }

function canUsePlan(store: Store, minPlan: string) {
  return store.subscription.active && planWeight(store.subscription.plan) >= planWeight(minPlan);
}

function productLimit(store: Store, features: PlanFeature[]): number | null {
  if (canUsePlan(store, "pro")) return null;
  const f = features.find(x => x.feature === "products");
  return f?.trialLimit ?? 10;
}

// ─── Mock API ─────────────────────────────────────────────────────────────────
export const mockApi = {

  // ── Auth ───────────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<AuthResponse> {
    await sleep();
    const db   = load();
    const user = db.users.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error("Email ou mot de passe incorrect");

    const store = user.storeId ? (db.stores.find((s) => s.id === user.storeId) ?? null) : null;
    const { password: _pw, storeId: _sid, ...safeUser } = user;
    return { token: `mock.${user.id}.${Date.now()}`, user: safeUser, store };
  },

  async register(input: { email: string; password: string; fullName: string; storeName: string }): Promise<AuthResponse> {
    await sleep();
    const db = load();
    if (db.users.some((u) => u.email === input.email)) throw new Error("Cet email est déjà utilisé");

    const userId  = `user-${Date.now()}`;
    const storeId = `store-${Date.now()}`;
    const slugBase = slugify(input.storeName || input.fullName || "store");
    let slug = slugBase; let n = 1;
    while (db.stores.some((s) => s.slug === slug)) slug = `${slugBase}-${++n}`;

    const store: Store = {
      id: storeId,
      name: input.storeName || `${input.fullName.split(" ")[0]}'s Store`,
      slug,
      ownerId: userId,
      currency: "MAD",
      city: "",
      logoUrl: null,
      notifications: { whatsappNumber: "", telegramChatId: null },
      tracking: { facebookPixel: null, tiktokPixel: null },
      theme: defaultTheme(),
      header: defaultHeader(),
      footer: defaultFooter(),
      onboardingComplete: false,
      subscription: {
        plan: "trial",
        expiresAt: new Date(Date.now() + db.settings.trial_days * 86400000).toISOString(),
        active: true,
      },
    };
    const newUser: User & { password: string; storeId: string } = {
      id: userId, email: input.email, fullName: input.fullName,
      role: "user", isAdmin: false, password: input.password, storeId,
    };
    db.users.push(newUser);
    db.stores.push(store);
    persist(db);

    const { password: _pw, storeId: _sid, ...safeUser } = newUser;
    return { token: `mock.${userId}.${Date.now()}`, user: safeUser, store };
  },

  // ── Stores ─────────────────────────────────────────────────────────────────
  async updateStore(tenantId: string, patch: Partial<Store>): Promise<Store> {
    await sleep(150);
    const db  = load();
    const idx = db.stores.findIndex((s) => s.id === tenantId);
    if (idx < 0) throw new Error("Boutique introuvable");
    db.stores[idx] = {
      ...db.stores[idx],
      ...patch,
      notifications: { ...db.stores[idx].notifications, ...(patch.notifications || {}) },
      tracking: { ...db.stores[idx].tracking, ...(patch.tracking || {}) },
    };
    persist(db);
    return db.stores[idx];
  },

  async getStoreBySlug(slug: string): Promise<Store | null> {
    await sleep(100);
    return load().stores.find((s) => s.slug === slug) ?? null;
  },

  // ── Products ───────────────────────────────────────────────────────────────
  async listProducts(tenantId: string): Promise<Product[]> {
    await sleep(100);
    return load().products.filter((p) => p.tenantId === tenantId);
  },

  async createProduct(tenantId: string, input: Omit<Product, "id" | "tenantId" | "createdAt">): Promise<Product> {
    await sleep();
    const db      = load();
    const store   = db.stores.find((s) => s.id === tenantId);
    if (!store) throw new Error("Boutique introuvable");

    // Plan gating: trial max 10
    const limit = productLimit(store, db.planFeatures);
    if (limit !== null) {
      const count = db.products.filter((p) => p.tenantId === tenantId && p.status !== "archived").length;
      if (count >= limit) {
        throw new Error(`Le plan Essai est limité à ${limit} produits. Passez au plan Pro pour des produits illimités.`);
      }
    }

    const product: Product = { ...input, id: `p-${Date.now()}`, tenantId, createdAt: new Date().toISOString() };
    db.products.push(product);
    persist(db);
    return product;
  },

  async updateProduct(tenantId: string, id: string, patch: Partial<Product>): Promise<Product> {
    await sleep();
    const db  = load();
    const idx = db.products.findIndex((p) => p.id === id && p.tenantId === tenantId);
    if (idx < 0) throw new Error("Produit introuvable");
    db.products[idx] = { ...db.products[idx], ...patch };
    persist(db);
    return db.products[idx];
  },

  async deleteProduct(tenantId: string, id: string): Promise<void> {
    await sleep();
    const db = load();
    db.products = db.products.filter((p) => !(p.id === id && p.tenantId === tenantId));
    persist(db);
  },

  // ── Orders ─────────────────────────────────────────────────────────────────
  async listOrders(tenantId: string): Promise<Order[]> {
    await sleep(100);
    return load().orders.filter((o) => o.tenantId === tenantId);
  },

  async createOrderFromCart(
    tenantId: string,
    payload: { customerName: string; phone: string; address?: string; city?: string; items: { productId: string; qty: number }[] },
  ): Promise<Order> {
    await sleep();
    const db       = load();
    const products = db.products.filter((p) => p.tenantId === tenantId);
    const items    = payload.items.map((it) => {
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
    persist(db);
    return order;
  },

  async confirmOrder(tenantId: string, id: string): Promise<Order> {
    await sleep(100);
    const db  = load();
    const idx = db.orders.findIndex((o) => o.id === id && o.tenantId === tenantId);
    if (idx < 0) throw new Error("Commande introuvable");
    db.orders[idx] = { ...db.orders[idx], status: "paid" };
    persist(db);
    return db.orders[idx];
  },

  // ── Customers ──────────────────────────────────────────────────────────────
  async listCustomers(tenantId: string): Promise<Customer[]> {
    await sleep(100);
    return load().customers.filter((c) => c.tenantId === tenantId);
  },

  // ── Dashboard ──────────────────────────────────────────────────────────────
  async dashboardStats(tenantId: string): Promise<DashboardStats> {
    await sleep(150);
    const db        = load();
    const orders    = db.orders.filter((o) => o.tenantId === tenantId);
    const products  = db.products.filter((p) => p.tenantId === tenantId);
    const customers = db.customers.filter((c) => c.tenantId === tenantId).length;
    const revenue   = orders.reduce((s, o) => s + o.total, 0);
    const today     = new Date().toDateString();
    const todayRevenue  = orders.filter((o) => new Date(o.createdAt).toDateString() === today).reduce((s, o) => s + o.total, 0);
    const newOrders     = orders.filter((o) => Date.now() - new Date(o.createdAt).getTime() < 86400000).length;
    const pending       = orders.filter((o) => o.status === "pending").length;
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

  // ── Admin ──────────────────────────────────────────────────────────────────
  async adminStats(): Promise<AdminStats> {
    await sleep(150);
    const db = load();
    const stores = db.stores;
    const users  = db.users;
    const orders = db.orders;
    const totalStores  = stores.length;
    const totalUsers   = users.length;
    const activeSubs   = stores.filter(s => s.subscription.active && new Date(s.subscription.expiresAt) > new Date()).length;
    const proSubs      = stores.filter(s => s.subscription.plan === "pro" && s.subscription.active).length;
    const trialSubs    = stores.filter(s => s.subscription.plan === "trial" && s.subscription.active).length;
    const expiredSubs  = stores.filter(s => !s.subscription.active || new Date(s.subscription.expiresAt) <= new Date()).length;
    const totalOrders  = orders.length;
    const totalRevenue = orders.filter(o => o.status !== "pending").reduce((s, o) => s + o.total, 0);
    const roleBreakdown: Record<string, number> = {};
    users.forEach(u => { roleBreakdown[u.role] = (roleBreakdown[u.role] || 0) + 1; });
    return {
      totalUsers, totalStores, activeSubs, proSubs, trialSubs, expiredSubs,
      totalOrders, totalRevenue,
      monthlyMrr: proSubs * 99,
      newUsers7d: 3,
      userGrowth: [
        { day: "2026-04-23", value: 2 }, { day: "2026-04-24", value: 4 },
        { day: "2026-04-25", value: 1 }, { day: "2026-04-26", value: 3 },
        { day: "2026-04-27", value: 2 }, { day: "2026-04-28", value: 5 },
        { day: "2026-04-29", value: 3 },
      ],
      roleBreakdown,
    };
  },

  async adminUsers(params?: { page?: number; q?: string; role?: string }): Promise<PaginatedResponse<AdminUser>> {
    await sleep(100);
    const db   = load();
    let items  = db.users;
    if (params?.q) {
      const q = params.q.toLowerCase();
      items = items.filter(u => u.email.includes(q) || u.fullName.toLowerCase().includes(q));
    }
    if (params?.role) items = items.filter(u => u.role === params.role);
    const page  = params?.page ?? 1;
    const limit = 25;
    const total = items.length;
    const slice = items.slice((page - 1) * limit, page * limit);
    return {
      total, page, pages: Math.max(1, Math.ceil(total / limit)),
      items: slice.map(u => ({
        id: u.id, email: u.email, fullName: u.fullName,
        role: u.role as UserRole, isAdmin: !!u.isAdmin,
        createdAt: new Date(now - Math.random() * 30 * 86400000).toISOString(),
        store: u.storeId ? (() => {
          const s = db.stores.find(x => x.id === u.storeId);
          return s ? {
            id: s.id, name: s.name, slug: s.slug,
            plan: s.subscription.plan, expiresAt: s.subscription.expiresAt,
            active: s.subscription.active,
            orderCount: db.orders.filter(o => o.tenantId === s.id).length,
          } : null;
        })() : null,
      })),
    };
  },

  async adminStores(params?: { page?: number; q?: string; plan?: string }): Promise<PaginatedResponse<AdminStore>> {
    await sleep(100);
    const db   = load();
    let items  = db.stores;
    if (params?.q) {
      const q = params.q.toLowerCase();
      items = items.filter(s => s.name.toLowerCase().includes(q) || s.slug.includes(q));
    }
    if (params?.plan) items = items.filter(s => s.subscription.plan === params.plan);
    const page  = params?.page ?? 1;
    const limit = 25;
    const total = items.length;
    const slice = items.slice((page - 1) * limit, page * limit);
    return {
      total, page, pages: Math.max(1, Math.ceil(total / limit)),
      items: slice.map(s => {
        const owner = db.users.find(u => u.id === s.ownerId);
        return {
          id: s.id, name: s.name, slug: s.slug,
          ownerEmail: owner?.email ?? "", ownerName: owner?.fullName ?? "",
          ownerRole: (owner?.role ?? "user") as UserRole,
          plan: s.subscription.plan, expiresAt: s.subscription.expiresAt,
          active: s.subscription.active,
          customDomain: s.customDomain ?? null,
          domainVerified: s.domainVerified ?? false,
          orderCount: db.orders.filter(o => o.tenantId === s.id).length,
          productCount: db.products.filter(p => p.tenantId === s.id).length,
          createdAt: new Date(now - Math.random() * 60 * 86400000).toISOString(),
        };
      }),
    };
  },

  // ── Platform Settings ──────────────────────────────────────────────────────
  async adminGetSettings(): Promise<PlatformSettings> {
    await sleep(100);
    return load().settings;
  },

  async adminUpdateSettings(patch: Partial<PlatformSettings>): Promise<{ ok: boolean }> {
    await sleep(200);
    const db = load();
    db.settings = { ...db.settings, ...patch };
    persist(db);
    return { ok: true };
  },

  async adminGetPlanFeatures(): Promise<PlanFeature[]> {
    await sleep(100);
    return load().planFeatures;
  },

  async publicSettings(): Promise<Partial<PlatformSettings>> {
    await sleep(50);
    const s = load().settings;
    // Exclude sensitive keys
    const { support_email: _e, support_whatsapp: _w, ...pub } = s;
    return pub;
  },
};
