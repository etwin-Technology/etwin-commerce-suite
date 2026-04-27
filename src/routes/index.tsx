import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, Globe, LayoutDashboard, Package, Users } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/components/MarketingChrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ETWIN Commerce — Lancez votre boutique en minutes" },
      { name: "description", content: "Plateforme SaaS e-commerce multi-tenant. Créez votre boutique, vendez en arabe et en français, gérez tout depuis un tableau de bord moderne." },
      { property: "og:title", content: "ETWIN Commerce — Lancez votre boutique en minutes" },
      { property: "og:description", content: "Plateforme SaaS e-commerce multi-tenant pour marchands francophones et arabophones." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface-alt via-background to-background" />
        <div className="absolute -z-10 top-32 start-1/2 -translate-x-1/2 size-[520px] rounded-full bg-ochre/10 blur-3xl" />
        <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-20 pb-28 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-ochre" />
            {t("landing.heroEyebrow")}
          </span>
          <h1 className="mt-8 font-serif text-5xl md:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.05]">
            {t("landing.heroTitle")}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {t("landing.ctaPrimary")} <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-6 py-3 text-sm font-medium hover:bg-surface-alt transition-colors"
            >
              {t("landing.ctaSecondary")}
            </Link>
          </div>

          {/* Mock dashboard preview */}
          <div className="mt-20 mx-auto max-w-5xl rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-surface-alt">
              <span className="size-2.5 rounded-full bg-destructive/40" />
              <span className="size-2.5 rounded-full bg-warning/40" />
              <span className="size-2.5 rounded-full bg-success/40" />
              <span className="ms-3 text-[11px] text-muted-foreground">app.etwin.commerce/dashboard</span>
            </div>
            <div className="grid grid-cols-4 gap-px bg-border">
              {[
                { label: t("dashboard.kpiRevenue"), value: "€47,582", delta: "+12.4%" },
                { label: t("dashboard.kpiOrders"), value: "1,847", delta: "+5.2%" },
                { label: t("dashboard.kpiCustomers"), value: "321", delta: "+10.5%" },
                { label: t("dashboard.kpiConversion"), value: "2.31%", delta: "-0.1%" },
              ].map((k) => (
                <div key={k.label} className="bg-card p-5 text-start">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
                  <p className="mt-2 font-serif text-2xl font-bold num">{k.value}</p>
                  <p className="text-xs text-success mt-1">{k.delta}</p>
                </div>
              ))}
            </div>
            <div className="h-44 bg-card border-t border-border p-6 flex items-end gap-2">
              {[40, 65, 50, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary/15 to-primary/40" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 lg:px-10 py-24">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl font-bold tracking-tight">{t("landing.featuresTitle")}</h2>
          <p className="mt-3 text-muted-foreground">{t("landing.featuresSubtitle")}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: LayoutDashboard, title: t("landing.feature1Title"), desc: t("landing.feature1Desc") },
            { icon: Package, title: t("landing.feature2Title"), desc: t("landing.feature2Desc") },
            { icon: Users, title: t("landing.feature3Title"), desc: t("landing.feature3Desc") },
            { icon: Globe, title: t("landing.feature4Title"), desc: t("landing.feature4Desc") },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-border bg-card hover:shadow-elegant transition-shadow">
              <div className="size-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center mb-4">
                <Icon className="size-5" />
              </div>
              <h3 className="font-serif text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 lg:px-10 py-24 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl font-bold tracking-tight">{t("landing.pricingTitle")}</h2>
          <p className="mt-3 text-muted-foreground">{t("landing.pricingSubtitle")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {(["trial", "basic", "pro"] as const).map((plan, i) => {
            const featured = plan === "basic";
            return (
              <div
                key={plan}
                className={`p-8 rounded-2xl border transition-shadow ${
                  featured
                    ? "border-primary bg-primary text-primary-foreground shadow-elegant"
                    : "border-border bg-card hover:shadow-elegant"
                }`}
              >
                <p className={`text-sm font-medium uppercase tracking-wider ${featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {t(`plans.${plan}`)}
                </p>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="font-serif text-5xl font-bold num">€{t(`plans.${plan}Price`)}</span>
                  <span className={`text-sm ${featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t("plans.perMonth")}</span>
                </p>
                <p className={`mt-3 text-sm ${featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {t(`plans.${plan}Desc`)}
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {[1, 2, 3].map((n) => (
                    <li key={n} className="flex items-center gap-2">
                      <Check className={`size-4 ${featured ? "text-ochre" : "text-success"}`} />
                      <span className={featured ? "text-primary-foreground/90" : "text-foreground"}>
                        {plan === "trial" && n === 1 ? "7 jours d'accès complet" : null}
                        {plan === "trial" && n === 2 ? "Tous les modules débloqués" : null}
                        {plan === "trial" && n === 3 ? "Aucune carte requise" : null}
                        {plan === "basic" && n === 1 ? "100 produits, ventes illimitées" : null}
                        {plan === "basic" && n === 2 ? "Statistiques de base" : null}
                        {plan === "basic" && n === 3 ? "Support email" : null}
                        {plan === "pro" && n === 1 ? "Produits & ventes illimités" : null}
                        {plan === "pro" && n === 2 ? "Analytics avancés" : null}
                        {plan === "pro" && n === 3 ? "Support prioritaire" : null}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`mt-8 inline-flex items-center justify-center w-full rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                    featured
                      ? "bg-background text-foreground hover:bg-background/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {t("plans.choose")}
                </Link>
                {i === -1 && null}
              </div>
            );
          })}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
