import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Bell, Check, MessageCircle, ShieldCheck, Smartphone, Truck, Zap } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/components/MarketingChrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ETWIN Commerce — صاوب متجر كيبيع فـ60 ثانية | 99 د.م./شهر" },
      { name: "description", content: "منصة مغربية لإطلاق متجر أونلاين فـ60 ثانية. WhatsApp مدمج، الدفع عند التسليم، إشعارات Telegram. 14 يوم تجربة مجانية." },
      { property: "og:title", content: "ETWIN Commerce — Crée une boutique qui vend en 60 secondes" },
      { property: "og:description", content: "Plateforme marocaine. WhatsApp + COD + Telegram. 14 jours gratuits." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.resolvedLanguage === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface-alt via-background to-background" />
        <div className="absolute -z-10 top-32 start-1/2 -translate-x-1/2 size-[520px] rounded-full bg-ochre/15 blur-3xl" />
        <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-16 pb-20 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground">
            {t("landing.badge")}
          </span>
          <h1 className="mt-6 font-serif text-[2.5rem] sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.05]">
            {t("landing.heroTitle")}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("landing.heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-7 py-3.5 text-base font-semibold hover:bg-primary/90 transition-colors shadow-elegant"
            >
              {t("landing.ctaPrimary")}
              <Arrow className="size-4" />
            </Link>
            <p className="text-xs text-muted-foreground">{t("landing.ctaNote")}</p>
          </div>

          {/* Demo "video" mock */}
          <div className="mt-14 mx-auto max-w-3xl rounded-3xl border border-border bg-card shadow-elegant overflow-hidden">
            <div className="relative aspect-video bg-gradient-to-br from-primary via-primary to-foreground/90 flex items-center justify-center text-primary-foreground">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,_oklch(70%_0.15_75)_0%,_transparent_40%)]" />
              <button className="relative size-20 rounded-full bg-card text-primary flex items-center justify-center shadow-elegant hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-7 ms-1"><path d="M8 5v14l11-7z" /></svg>
              </button>
              <p className="absolute bottom-5 inset-x-0 text-center text-sm font-medium">{t("landing.watchDemo")}</p>
            </div>
          </div>

          {/* Trust counter + guarantee */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="size-7 rounded-full border-2 border-background bg-gradient-to-br from-ochre via-primary to-foreground" />
                ))}
              </span>
              <span className="font-medium text-foreground">{t("landing.trustCounter")}</span>
            </div>
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="size-4 text-success" />
              <span>{t("landing.guarantee")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 lg:px-10 py-20">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">{t("landing.featuresTitle")}</h2>
          <p className="mt-3 text-muted-foreground">{t("landing.featuresSubtitle")}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: Zap, title: t("landing.f1Title"), desc: t("landing.f1Desc"), tone: "ochre" as const },
            { icon: MessageCircle, title: t("landing.f2Title"), desc: t("landing.f2Desc"), tone: "success" as const },
            { icon: Truck, title: t("landing.f3Title"), desc: t("landing.f3Desc"), tone: "primary" as const },
            { icon: Bell, title: t("landing.f4Title"), desc: t("landing.f4Desc"), tone: "primary" as const },
            { icon: Smartphone, title: t("landing.f5Title"), desc: t("landing.f5Desc"), tone: "ochre" as const },
            { icon: ShieldCheck, title: t("landing.f6Title"), desc: t("landing.f6Desc"), tone: "success" as const },
          ].map(({ icon: Icon, title, desc, tone }) => (
            <div key={title} className="p-6 rounded-2xl border border-border bg-card hover:shadow-elegant transition-shadow">
              <div className={`size-10 rounded-lg flex items-center justify-center mb-4 ${
                tone === "ochre" ? "bg-ochre/15 text-ochre" : tone === "success" ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
              }`}>
                <Icon className="size-5" />
              </div>
              <h3 className="font-serif text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-16 border-t border-border">
        <h2 className="font-serif text-3xl font-bold tracking-tight text-center mb-10">
          {t("landing.testimonialsTitle")}
        </h2>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {[
            { name: "Hamza, Casablanca", quote: "بدلت Shopify بـETWIN، فلوس قل، مبيعات أكثر. الـTelegram bot هاد شي زوين.", revenue: "32,400 MAD/mois" },
            { name: "Salma, Tanger", quote: "صاوبت المتجر فـ4 دقائق. أول طلب جا فـ24 ساعة. شكراً ETWIN.", revenue: "8,900 MAD/mois" },
            { name: "Anas, Marrakech", quote: "WhatsApp + COD = combo قاتل. زبناءي كيوثقو وكيشريو بلا تردد.", revenue: "21,750 MAD/mois" },
          ].map((tm) => (
            <figure key={tm.name} className="p-6 rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-11 rounded-full bg-gradient-to-br from-ochre to-primary" />
                <div>
                  <figcaption className="font-semibold text-sm">{tm.name}</figcaption>
                  <p className="text-[11px] text-success font-medium num">{tm.revenue}</p>
                </div>
              </div>
              <blockquote className="text-sm text-foreground leading-relaxed">"{tm.quote}"</blockquote>
              <div className="mt-3 text-ochre text-sm">★★★★★</div>
            </figure>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 lg:px-10 py-20 border-t border-border">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">{t("landing.pricingTitle")}</h2>
          <p className="mt-3 text-muted-foreground">{t("landing.pricingSubtitle")}</p>
        </div>
        <div className="max-w-md mx-auto p-8 rounded-3xl border-2 border-primary bg-primary text-primary-foreground shadow-elegant relative overflow-hidden">
          <div className="absolute -top-12 -end-12 size-40 rounded-full bg-ochre/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">
                {t("plans.pro")}
              </p>
              <span className="text-[11px] font-bold bg-ochre text-foreground px-2.5 py-1 rounded-full">
                {t("plans.trialBadge")}
              </span>
            </div>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="font-serif text-6xl font-bold num">{t("plans.proPrice")}</span>
              <span className="text-base">{t("plans.proCurrency")}</span>
              <span className="text-sm text-primary-foreground/70">{t("plans.proPeriod")}</span>
            </p>
            <p className="text-xs text-primary-foreground/70 mt-1">{t("plans.yearly")}</p>

            <ul className="mt-7 space-y-2.5 text-sm">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <li key={n} className="flex items-start gap-2.5">
                  <Check className="size-4 text-ochre shrink-0 mt-0.5" />
                  <span className="text-primary-foreground/95">{t(`plans.feat${n}`)}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className="mt-8 inline-flex items-center justify-center w-full rounded-full px-5 py-3 text-sm font-semibold bg-card text-foreground hover:bg-card/90 transition-colors"
            >
              {t("plans.ctaStart")}
            </Link>
            <p className="mt-3 text-center text-[11px] text-primary-foreground/70">{t("landing.ctaNote")}</p>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
