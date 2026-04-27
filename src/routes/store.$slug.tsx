import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { ShoppingBag, X, Plus, Minus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Product, Store } from "@/lib/api/types";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/store/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — ETWIN Commerce` },
      { name: "description", content: `Découvrez la boutique ${params.slug} sur ETWIN Commerce.` },
      { property: "og:title", content: `${params.slug} — ETWIN Commerce` },
    ],
  }),
  component: StorePage,
});

interface CartLine {
  productId: string;
  qty: number;
}

function StorePage() {
  const { slug } = useParams({ from: "/store/$slug" });
  const { t } = useTranslation();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "" });
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getStoreBySlug(slug).then(async (s) => {
      if (!active) return;
      setStore(s);
      if (s) {
        const list = await api.listProducts(s.id);
        if (active) setProducts(list.filter((p) => p.status === "active"));
      }
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const addToCart = (id: string) => {
    setCart((c) => {
      const found = c.find((l) => l.productId === id);
      if (found) return c.map((l) => (l.productId === id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { productId: id, qty: 1 }];
    });
    setCartOpen(true);
  };
  const setQty = (id: string, qty: number) => {
    if (qty <= 0) setCart((c) => c.filter((l) => l.productId !== id));
    else setCart((c) => c.map((l) => (l.productId === id ? { ...l, qty } : l)));
  };

  const cartLines = cart.map((l) => {
    const p = products.find((x) => x.id === l.productId);
    return { ...l, product: p };
  });
  const total = cartLines.reduce((s, l) => s + (l.product?.price ?? 0) * l.qty, 0);
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: store?.currency || "EUR" }).format(n);

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    const o = await api.createOrderFromCart(store.id, {
      customerName: checkoutForm.name,
      phone: checkoutForm.phone,
      items: cart.map((l) => ({ productId: l.productId, qty: l.qty })),
    });
    setOrderId(o.id);
    setCart([]);
    setCheckoutForm({ name: "", phone: "" });
  };

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center text-muted-foreground">{t("common.loading")}</div>;
  }
  if (!store) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Boutique introuvable.</p>
        <Link to="/" className="text-primary hover:underline">{t("common.back")}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 lg:px-10 h-16">
          <Link to="/store/$slug" params={{ slug }} className="font-serif text-xl font-bold tracking-tight">
            {store.name}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher subtle />
            <button
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium hover:bg-primary/90"
            >
              <ShoppingBag className="size-4" />
              <span>{t("store.cart")}</span>
              {cart.length > 0 && (
                <span className="ms-1 bg-ochre text-foreground rounded-full size-5 text-[10px] flex items-center justify-center font-bold">
                  {cart.reduce((s, l) => s + l.qty, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-16">
        <h1 className="font-serif text-5xl font-bold tracking-tight">{t("store.products")}</h1>
        <p className="text-muted-foreground mt-2">{store.name} · /store/{store.slug}</p>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <article key={p.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-elegant transition-shadow">
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  className="size-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <h3 className="font-serif text-lg font-bold">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold text-lg num">{fmt(p.price)}</span>
                  {p.stock > 0 ? (
                    <button
                      onClick={() => addToCart(p.id)}
                      className="text-sm font-medium bg-primary text-primary-foreground rounded-full px-4 py-1.5 hover:bg-primary/90"
                    >
                      {t("store.addToCart")}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("store.outOfStock")}</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-30">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setCartOpen(false)} />
          <div className="absolute inset-y-0 end-0 w-full max-w-md bg-background border-s border-border flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold">{t("store.cart")}</h2>
              <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-muted rounded-md">
                <X className="size-4" />
              </button>
            </div>

            {orderId ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="size-12 rounded-full bg-success/15 text-success flex items-center justify-center mb-4">✓</div>
                <h3 className="font-serif text-xl font-bold">Merci !</h3>
                <p className="text-sm text-muted-foreground mt-2">Commande #{orderId} enregistrée.</p>
                <button onClick={() => { setOrderId(null); setCartOpen(false); }} className="mt-6 text-sm text-primary hover:underline">
                  {t("common.back")}
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                {t("store.emptyCart")}
              </div>
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto divide-y divide-border">
                  {cartLines.map((l) => l.product && (
                    <li key={l.productId} className="p-4 flex gap-3">
                      <img src={l.product.image} alt={l.product.name} className="size-16 rounded-lg object-cover bg-muted" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{l.product.name}</p>
                        <p className="text-xs text-muted-foreground num">{fmt(l.product.price)}</p>
                        <div className="mt-2 inline-flex items-center gap-1 border border-border rounded-full">
                          <button onClick={() => setQty(l.productId, l.qty - 1)} className="p-1 hover:bg-muted rounded-s-full"><Minus className="size-3" /></button>
                          <span className="px-3 text-sm num">{l.qty}</span>
                          <button onClick={() => setQty(l.productId, l.qty + 1)} className="p-1 hover:bg-muted rounded-e-full"><Plus className="size-3" /></button>
                        </div>
                      </div>
                      <p className="font-bold num">{fmt(l.product.price * l.qty)}</p>
                    </li>
                  ))}
                </ul>
                <form onSubmit={checkout} className="border-t border-border p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-lg num">{fmt(total)}</span>
                  </div>
                  <input
                    required
                    placeholder="Nom complet"
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    required
                    placeholder="Téléphone"
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button type="submit" className="w-full bg-primary text-primary-foreground rounded-full py-2.5 text-sm font-medium hover:bg-primary/90">
                    {t("store.checkout")}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
