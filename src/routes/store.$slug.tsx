import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Facebook, Instagram, MapPin, MessageCircle, ShieldCheck, ShoppingBag, Star, Truck, X, Youtube } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { Product, Store } from "@/lib/api/types";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MAD } from "@/lib/format";

export const Route = createFileRoute("/store/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — ETWIN` },
      { name: "description", content: `Boutique ${params.slug} sur ETWIN. Paiement à la livraison.` },
      { property: "og:title", content: `${params.slug}` },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { slug } = useParams({ from: "/store/$slug" });
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage as "ar" | "fr") || "ar";
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [orderDone, setOrderDone] = useState<{ id: string } | null>(null);
  const [tick, setTick] = useState(0);

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
    return () => { active = false; };
  }, [slug]);

  // Live "X bought" pulse
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 8000);
    return () => clearInterval(id);
  }, []);

  /**
   * Inject Facebook & TikTok pixels when the store has them configured.
   * Backend already prevents saving these IDs unless the `pixels` feature is
   * enabled, so the mere presence here implies the feature is granted.
   * Loads each script once per store and fires a single PageView.
   */
  useEffect(() => {
    if (!store) return;
    const fb = store.tracking.facebookPixel?.trim();
    const tt = store.tracking.tiktokPixel?.trim();
    const cleanups: Array<() => void> = [];

    if (fb && /^[A-Za-z0-9_-]{6,40}$/.test(fb) && !(window as unknown as { fbq?: unknown }).fbq) {
      const s = document.createElement("script");
      s.id = "etwin-fb-pixel";
      s.async = true;
      s.text = `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${fb.replace(/'/g, "")}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(s);
      cleanups.push(() => s.remove());
    }

    if (tt && /^[A-Za-z0-9_-]{6,40}$/.test(tt) && !(window as unknown as { ttq?: unknown }).ttq) {
      const s = document.createElement("script");
      s.id = "etwin-tt-pixel";
      s.async = true;
      s.text = `
        !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
        ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
        ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
        for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
        ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
        ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
        var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
        var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load('${tt.replace(/'/g, "")}');ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(s);
      cleanups.push(() => s.remove());
    }

    return () => cleanups.forEach(fn => fn());
  }, [store?.id, store?.tracking.facebookPixel, store?.tracking.tiktokPixel]);

  const liveBuyer = useMemo(() => {
    const names = ["Mohamed", "Fatima", "Karim", "Sara", "Amine", "Yasmine", "Idris", "Hajar"];
    const cities = ["Rabat", "Casablanca", "Tanger", "Fès", "Marrakech", "Agadir"];
    const min = ((tick * 3) % 14) + 2;
    return { name: names[tick % names.length], city: cities[tick % cities.length], min };
  }, [tick]);

  if (loading) return <div className="min-h-dvh flex items-center justify-center text-muted-foreground">{t("common.loading")}</div>;
  if (!store) return <div className="min-h-dvh flex items-center justify-center"><Link to="/" className="text-primary hover:underline">{t("common.back")}</Link></div>;

  const wa      = store.notifications.whatsappNumber.replace(/\D/g, "");
  const primary = store.theme?.primaryColor ?? "#7C3AED";
  const accent  = store.theme?.accentColor  ?? "#F59E0B";
  const logoUrl = store.header?.logoUrl ?? store.logoUrl;
  const menuLinks = store.header?.menuLinks ?? [];
  const announcement = store.header?.announcementBar && store.header?.announcementText;
  const footer   = store.footer;
  const socials  = footer?.socials ?? {};
  const h        = store.header ?? {} as NonNullable<typeof store.header>;
  // Modern display options — defaults preserve the previous look.
  const heroTitle    = h.heroTitle ?? store.name;
  const heroSub      = h.heroSubtitle ?? footer?.description ?? "";
  const heroCta      = h.heroCta ?? "";
  const bannerImg    = h.bannerImageUrl ?? null;
  const cols         = h.productColumns ?? 3;
  const showTrust    = h.showTrustBar    ?? true;
  const showLive     = h.showLiveBuyer   ?? true;
  const showRatings  = h.showRatings     ?? true;
  const showScarcity = h.showScarcity    ?? true;
  const gridCls = cols === 4
    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
    : cols === 2
    ? "grid-cols-2"
    : "grid-cols-2 lg:grid-cols-3";

  return (
    <div className="min-h-dvh bg-background pb-24" style={{ ["--store-primary" as string]: primary } as React.CSSProperties}>
      {/* Announcement bar */}
      {announcement && (
        <div className="text-center py-2 text-xs font-semibold text-white" style={{ backgroundColor: accent }}>
          {store.header!.announcementText}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt={store.name} className="h-10 w-auto object-contain shrink-0" />
            ) : (
              <div
                className="size-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                style={{ backgroundColor: primary }}
              >
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-serif text-lg font-bold tracking-tight truncate">{store.name}</p>
              {store.city && (
                <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {store.city}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {menuLinks.length > 0 && (
              <nav className="hidden sm:flex items-center gap-4">
                {menuLinks.slice(0, 4).map((l, i) => (
                  <a key={i} href={l.url} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
                ))}
              </nav>
            )}
            <LanguageSwitcher subtle />
          </div>
        </div>
      </header>

      {/* HERO BANNER — image-backed when bannerImageUrl is set, gradient otherwise */}
      <section className="relative overflow-hidden">
        {bannerImg ? (
          <>
            <img
              src={bannerImg}
              alt=""
              className="absolute inset-0 size-full object-cover"
              loading="eager"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(180deg, ${primary}cc 0%, ${primary}aa 60%, ${primary}ee 100%)` }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 60%, ${accent} 100%)` }}
          />
        )}
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 text-center text-white">
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight drop-shadow-sm">
            {heroTitle}
          </h1>
          {heroSub && (
            <p className="mt-3 text-sm sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
              {heroSub}
            </p>
          )}
          {heroCta && products.length > 0 && (
            <a
              href="#products"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: accent, color: "#0b0b0b" }}
            >
              <ShoppingBag className="size-4" />
              {heroCta}
            </a>
          )}
        </div>
      </section>

      {/* Trust bar */}
      {showTrust && (
        <div className="bg-success/10 border-b border-success/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2.5 flex flex-wrap justify-center items-center gap-x-6 gap-y-1 text-[11px] sm:text-xs text-foreground">
            <span className="inline-flex items-center gap-1.5"><Truck className="size-4 text-success" /> {t("store.cod")}</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-success" /> {t("store.freeShip")}</span>
            <span className="inline-flex items-center gap-1.5"><MessageCircle className="size-4 text-success" /> Support 7j/7</span>
          </div>
        </div>
      )}

      {/* Live notification */}
      {showLive && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 text-[11px] text-muted-foreground shadow-card animate-pulse">
            <Bell className="size-3 text-ochre" />
            <span>{t("store.liveBuyer", liveBuyer)}</span>
          </div>
        </div>
      )}

      {/* Products */}
      <section id="products" className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        {products.length === 0 ? (
          <EmptyCatalog primary={primary} />
        ) : (
          <div className={`grid ${gridCls} gap-3 sm:gap-5`}>
            {products.map((p) => {
              const discount = p.originalPrice && p.originalPrice > p.price;
              const lowStock = showScarcity && p.stock > 0 && p.stock <= 5;
              return (
                <article
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-elegant hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col"
                >
                  <div className="aspect-square bg-muted overflow-hidden relative">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"; }}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {discount && (
                      <span className="absolute top-2 start-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        -{Math.round((1 - p.price / (p.originalPrice as number)) * 100)}%
                      </span>
                    )}
                    {lowStock && (
                      <span className="absolute top-2 end-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        🔥 {p.stock}
                      </span>
                    )}
                    {/* Quick-view button on hover */}
                    <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span
                        className="block w-full text-center py-2 rounded-lg text-xs font-bold text-white shadow-md"
                        style={{ backgroundColor: primary }}
                      >
                        {t("store.buyNow")}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-medium text-sm line-clamp-2 leading-snug min-h-[2.6em]">{p.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="font-bold text-foreground num">{MAD(p.price, lang)}</span>
                      {discount && <s className="text-[11px] text-muted-foreground num">{MAD(p.originalPrice as number, lang)}</s>}
                    </div>
                    {showScarcity && p.stock === 0 && (
                      <p className="mt-1.5 text-[10px] text-muted-foreground font-semibold">Rupture de stock</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* WhatsApp floating CTA */}
      {wa && (
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 end-5 z-30 inline-flex items-center gap-2 rounded-full bg-success text-success-foreground px-4 py-3 shadow-elegant hover:scale-105 transition-transform"
          aria-label="WhatsApp"
        >
          <MessageCircle className="size-5" />
          <span className="text-sm font-semibold hidden sm:inline">WhatsApp</span>
        </a>
      )}

      {/* Product detail / Buy modal */}
      {selected && (
        <ProductSheet
          product={selected}
          store={store}
          onClose={() => setSelected(null)}
          onOrdered={(id) => { setOrderDone({ id }); setSelected(null); }}
          lang={lang}
          showRatings={showRatings}
          showScarcity={showScarcity}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-serif font-bold text-sm">{store.name}</p>
              {footer?.description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{footer.description}</p>}
              {(footer?.links ?? []).length > 0 && (
                <div className="flex flex-wrap gap-3 mt-2">
                  {(footer?.links ?? []).map((l, i) => (
                    <a key={i} href={l.url} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
                  ))}
                </div>
              )}
            </div>
            {(socials.instagram || socials.facebook || socials.tiktok || socials.youtube) && (
              <div className="flex items-center gap-3">
                {socials.instagram && <a href={socials.instagram} target="_blank" rel="noreferrer" className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Instagram className="size-4" /></a>}
                {socials.facebook  && <a href={socials.facebook}  target="_blank" rel="noreferrer" className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Facebook  className="size-4" /></a>}
                {socials.youtube   && <a href={socials.youtube}   target="_blank" rel="noreferrer" className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Youtube   className="size-4" /></a>}
              </div>
            )}
          </div>
          {footer?.showPoweredBy !== false && (
            <p className="text-center text-[10px] text-muted-foreground/50 mt-6">
              Propulsé par <a href="/" className="hover:text-primary transition-colors font-medium">ETWIN Commerce</a>
            </p>
          )}
        </div>
      </footer>

      {/* Order confirmation */}
      {orderDone && (
        <div className="fixed inset-0 z-40 bg-foreground/40 flex items-center justify-center p-4" onClick={() => setOrderDone(null)}>
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="size-14 mx-auto rounded-2xl bg-success/15 text-success flex items-center justify-center mb-3">
              <Check className="size-7" />
            </div>
            <h3 className="font-serif text-xl font-bold">{t("store.thankYou")}</h3>
            <p className="text-sm text-muted-foreground mt-2">{t("store.orderRef", { id: orderDone.id })}</p>
            <p className="text-xs text-muted-foreground mt-3">{t("store.orderDetails")}</p>
            <button onClick={() => setOrderDone(null)} className="mt-5 w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Empty-catalog placeholder shown when the store has no active products yet.
 * Keeps the page visually anchored instead of looking broken.
 */
function EmptyCatalog({ primary }: { primary: string }) {
  return (
    <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-border bg-card">
      <div
        className="size-16 mx-auto rounded-2xl flex items-center justify-center text-white"
        style={{ backgroundColor: `${primary}22`, color: primary }}
      >
        <ShoppingBag className="size-8" />
      </div>
      <h2 className="mt-4 font-serif text-xl font-bold">Bientôt disponible</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Cette boutique prépare son catalogue. Revenez très vite pour découvrir les nouveautés.
      </p>
    </div>
  );
}

function ProductSheet({
  product,
  store,
  onClose,
  onOrdered,
  lang,
  showRatings,
  showScarcity,
}: {
  product: Product;
  store: Store;
  onClose: () => void;
  onOrdered: (id: string) => void;
  lang: "ar" | "fr";
  showRatings: boolean;
  showScarcity: boolean;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const images = [product.image, ...(product.extraImages || [])];
  const [activeImg, setActiveImg] = useState(0);
  const discount = product.originalPrice && product.originalPrice > product.price;
  const saved = discount ? (product.originalPrice as number) - product.price : 0;

  // Fire ViewContent once when this product sheet mounts.
  useEffect(() => {
    const w = window as unknown as {
      fbq?: (a: string, b: string, c?: Record<string, unknown>) => void;
      ttq?: { track: (a: string, b?: Record<string, unknown>) => void };
    };
    try { w.fbq?.("track", "ViewContent", { content_ids: [product.id], value: product.price, currency: store.currency }); } catch { /* */ }
    try { w.ttq?.track("ViewContent",     { content_id: product.id, value: product.price, currency: store.currency }); } catch { /* */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.phone.replace(/\D/g, "").length < 8) {
      toast.error("Nom et téléphone valides requis");
      return;
    }
    setSubmitting(true);
    try {
      const o = await api.createOrderFromCart(store.slug, {
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: store.city,
        items: [{ productId: product.id, qty }],
      });
      // Fire pixel events if pixels are configured (scripts loaded earlier).
      const total = product.price * qty;
      const w = window as unknown as {
        fbq?: (a: string, b: string, c?: Record<string, unknown>) => void;
        ttq?: { track: (a: string, b?: Record<string, unknown>) => void };
      };
      try { w.fbq?.("track", "Purchase",  { value: total, currency: store.currency, contents: [{ id: product.id, quantity: qty }] }); } catch { /* */ }
      try { w.ttq?.track("CompletePayment", { value: total, currency: store.currency, contents: [{ content_id: product.id, quantity: qty }] }); } catch { /* */ }
      onOrdered(o.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la commande");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 bg-foreground/30 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-3 bg-background/95 backdrop-blur border-b border-border">
          <p className="text-sm font-semibold truncate ms-2">{product.name}</p>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-muted"><X className="size-4" /></button>
        </div>

        <div className="aspect-square bg-muted">
          <img src={images[activeImg]} alt={product.name} className="size-full object-cover" />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)} className={`size-14 rounded-lg overflow-hidden border-2 shrink-0 ${i === activeImg ? "border-primary" : "border-transparent"}`}>
                <img src={img} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-5">
          <h2 className="font-serif text-2xl font-bold">{product.name}</h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-bold text-2xl num">{MAD(product.price, lang)}</span>
            {discount && (
              <>
                <s className="text-sm text-muted-foreground num">{MAD(product.originalPrice as number, lang)}</s>
                <span className="text-[11px] font-bold bg-destructive/15 text-destructive rounded-full px-2 py-0.5 num">
                  {t("store.save", { amount: saved })}
                </span>
              </>
            )}
          </div>

          {showScarcity && product.stock <= 5 && product.stock > 0 && (
            <p className="mt-3 inline-block text-xs font-semibold bg-destructive/10 text-destructive px-2.5 py-1 rounded-full">
              🔥 {t("store.scarcityLeft", { n: product.stock })}
            </p>
          )}

          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{product.description}</p>

          {/* Trust + delivery */}
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2"><Truck className="size-4 text-success" /> {t("store.cod")}</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-success" /> {t("store.freeShip")}</li>
            <li className="flex items-center gap-2"><Bell className="size-4 text-ochre" /> {t("store.boughtToday", { n: 15 + Math.floor(Math.random() * 12) })}</li>
          </ul>

          {/* Reviews */}
          {showRatings && (
            <div className="mt-5 p-4 rounded-xl bg-surface-alt border border-border">
              <div className="flex items-center gap-2">
                <div className="text-ochre flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className="size-4 fill-current" />)}</div>
                <span className="text-sm font-semibold">4.8</span>
                <span className="text-xs text-muted-foreground">· 124 {t("store.reviews")}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">"Produit de très bonne qualité, livré en 2 jours. Je recommande!" — Sara, Casablanca</p>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-5 inline-flex items-center gap-1 border border-border rounded-full">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5 hover:bg-muted rounded-s-full">−</button>
            <span className="px-4 text-sm font-semibold num">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-3 py-1.5 hover:bg-muted rounded-e-full">+</button>
          </div>

          {/* Order form */}
          <form onSubmit={submit} className="mt-5 space-y-3">
            <input required placeholder={t("store.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input required placeholder={t("store.phone")} value={form.phone} dir="ltr" onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input required placeholder={t("store.addressPh")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />

            <button type="submit" disabled={submitting || product.stock === 0}
              className="w-full rounded-xl bg-success text-success-foreground py-3.5 text-sm font-bold hover:opacity-95 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              <ShoppingBag className="size-4" />
              {product.stock === 0 ? t("store.outOfStock") : submitting ? t("common.loading") : `${t("store.confirmOrder")} · ${MAD(product.price * qty, lang)}`}
            </button>
            <p className="text-center text-[11px] text-muted-foreground">{t("store.cod")}</p>
          </form>
        </div>
      </div>
    </div>
  );
}
