import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, ShieldCheck, Star, Play, Sparkles,
  Zap, MessageCircle, Truck, Bell, Smartphone, Rocket, ChevronDown,
} from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/components/MarketingChrome";
import { useLandingContent, type Lang } from "@/lib/landing";

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

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  "message-circle": MessageCircle,
  truck: Truck,
  bell: Bell,
  smartphone: Smartphone,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  rocket: Rocket,
};

function Landing() {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage === "ar" ? "ar" : "fr") as Lang;
  const c = useLandingContent(lang);
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-dvh flex flex-col bg-background overflow-x-hidden">
      <MarketingHeader />

      {/* HERO */}
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface-alt via-background to-background" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(60%_50%_at_50%_0%,_oklch(70%_0.15_75/.18),transparent_70%)]" />
        <div className="absolute -z-10 -top-20 start-1/2 -translate-x-1/2 size-[520px] rounded-full bg-primary/10 blur-[120px]" />

        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 pt-12 sm:pt-20 pb-16 sm:pb-24">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/70 backdrop-blur text-xs font-medium text-muted-foreground shadow-sm">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              {c.badge}
            </span>

            <h1 className="mt-6 font-serif text-[2.25rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto">
              {c.heroTitle}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-primary">{c.heroHighlight}</span>
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-ochre/60" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
                  <path d="M2 9 Q 50 2, 100 6 T 198 5" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
              {c.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-7 py-3.5 text-base font-semibold hover:bg-primary/90 transition-all shadow-elegant hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto"
              >
                {c.ctaPrimary}
                <Arrow className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold border border-border bg-card hover:bg-muted transition-colors w-full sm:w-auto"
              >
                <Play className="size-4 text-primary" />
                {c.ctaSecondary}
              </a>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{c.ctaNote}</p>
          </div>

          {/* Hero stats */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {c.heroStats.map((s) => (
              <div key={s.label} className="text-center p-4 sm:p-5 rounded-2xl border border-border bg-card/60 backdrop-blur">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-primary num">{s.value}</div>
                <div className="mt-1 text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Demo card */}
          <div className="mt-14 mx-auto max-w-4xl rounded-3xl border border-border bg-card shadow-elegant overflow-hidden">
            <div className="relative aspect-video bg-gradient-to-br from-primary via-primary to-foreground/90 flex items-center justify-center text-primary-foreground">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,_oklch(70%_0.15_75)_0%,_transparent_40%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,transparent_98%,rgba(255,255,255,.05)_98%),linear-gradient(to_bottom,transparent,transparent_98%,rgba(255,255,255,.05)_98%)] bg-[size:32px_32px]" />
              <button className="relative size-16 sm:size-20 rounded-full bg-card text-primary flex items-center justify-center shadow-elegant hover:scale-105 transition-transform">
                <Play className="size-6 sm:size-7 ms-1" fill="currentColor" />
              </button>
              <p className="absolute bottom-4 sm:bottom-5 inset-x-0 text-center text-xs sm:text-sm font-medium px-4">{c.watchDemo}</p>
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="size-7 rounded-full border-2 border-background bg-gradient-to-br from-ochre via-primary to-foreground" />
                ))}
              </span>
              <span className="font-medium text-foreground text-xs sm:text-sm">{c.trustCounter}</span>
            </div>
            <div className="inline-flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
              <ShieldCheck className="size-4 text-success shrink-0" />
              <span>{c.guarantee}</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">{c.howTitle}</h2>
          <p className="mt-3 text-muted-foreground">{c.howSubtitle}</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {c.steps.map((s, i) => (
            <div key={i} className="relative p-6 rounded-2xl border border-border bg-card hover:shadow-elegant transition-shadow">
              <div className="absolute -top-3 start-6 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold num">
                {i + 1}
              </div>
              <h3 className="mt-2 font-serif text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 py-16 sm:py-20 border-t border-border">
        <div className="text-center mb-12 sm:mb-14">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">{c.featuresTitle}</h2>
          <p className="mt-3 text-muted-foreground">{c.featuresSubtitle}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {c.features.map((f, i) => {
            const Icon = ICONS[f.icon] ?? Sparkles;
            const tone = ["ochre", "success", "primary"][i % 3] as "ochre" | "success" | "primary";
            return (
              <div key={i} className="group p-6 rounded-2xl border border-border bg-card hover:shadow-elegant hover:-translate-y-0.5 transition-all">
                <div className={`size-11 rounded-xl flex items-center justify-center mb-4 ${
                  tone === "ochre" ? "bg-ochre/15 text-ochre" : tone === "success" ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
                }`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="font-serif text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 py-16 sm:py-20 border-t border-border">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">{c.testimonialsTitle}</h2>
          <p className="mt-3 text-muted-foreground">{c.testimonialsSubtitle}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {c.testimonials.map((tm, i) => (
            <figure key={i} className="p-6 rounded-2xl border border-border bg-card flex flex-col">
              <div className="flex text-ochre mb-3" aria-label="5 stars">
                {[0,1,2,3,4].map(n => <Star key={n} className="size-4" fill="currentColor" />)}
              </div>
              <blockquote className="text-sm sm:text-base text-foreground leading-relaxed flex-1">"{tm.quote}"</blockquote>
              <div className="mt-5 pt-5 border-t border-border flex items-center gap-3">
                <div className="size-11 rounded-full bg-gradient-to-br from-ochre to-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {tm.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <figcaption className="font-semibold text-sm">{tm.name}, {tm.city}</figcaption>
                  <p className="text-[11px] text-success font-medium num">{tm.revenue}</p>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 py-16 sm:py-20 border-t border-border">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">{c.pricingTitle}</h2>
          <p className="mt-3 text-muted-foreground">{c.pricingSubtitle}</p>
        </div>
        <div className="max-w-md mx-auto p-7 sm:p-8 rounded-3xl border-2 border-primary bg-primary text-primary-foreground shadow-elegant relative overflow-hidden">
          <div className="absolute -top-12 -end-12 size-40 rounded-full bg-ochre/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">Pro</p>
              <span className="text-[11px] font-bold bg-ochre text-foreground px-2.5 py-1 rounded-full">14 {isAr ? "يوم مجاناً" : "j gratuits"}</span>
            </div>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="font-serif text-5xl sm:text-6xl font-bold num">{c.pricingPrice}</span>
              <span className="text-base">{c.pricingCurrency}</span>
              <span className="text-sm text-primary-foreground/70">{c.pricingPeriod}</span>
            </p>
            <ul className="mt-7 space-y-2.5 text-sm">
              {c.pricingFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="size-4 text-ochre shrink-0 mt-0.5" />
                  <span className="text-primary-foreground/95">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center justify-center w-full rounded-full px-5 py-3 text-sm font-semibold bg-card text-foreground hover:bg-card/90 transition-colors"
            >
              {c.pricingCta}
            </Link>
            <p className="mt-3 text-center text-[11px] text-primary-foreground/70">{c.ctaNote}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-10 py-16 sm:py-20 border-t border-border">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-center mb-10">{c.faqTitle}</h2>
        <div className="space-y-3">
          {c.faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-foreground text-background p-10 sm:p-14 text-center">
          <div className="absolute -top-20 start-1/2 -translate-x-1/2 size-[400px] rounded-full bg-primary/40 blur-3xl" />
          <div className="relative">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">{c.ctaSectionTitle}</h2>
            <p className="mt-3 text-background/70">{c.ctaSectionSub}</p>
            <Link
              to="/register"
              className="mt-7 inline-flex items-center gap-2 bg-ochre text-foreground rounded-full px-7 py-3.5 text-base font-semibold hover:bg-ochre/90 transition-colors"
            >
              {c.ctaPrimary}
              <Arrow className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 text-start"
        aria-expanded={open}
      >
        <span className="font-semibold text-foreground">{q}</span>
        <ChevronDown className={`size-5 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</div>}
    </div>
  );
}
