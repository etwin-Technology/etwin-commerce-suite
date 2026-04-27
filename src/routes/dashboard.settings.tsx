import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { Check } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { store } = useAuth();
  if (!store) return null;
  const days = Math.max(0, Math.ceil((new Date(store.subscription.expiresAt).getTime() - Date.now()) / 86400000));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 mb-6">
        <h2 className="font-serif text-xl font-bold">{t("settings.storeInfo")}</h2>
        <dl className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
          <Row label="Nom" value={store.name} />
          <Row label="Slug" value={`/store/${store.slug}`} />
          <Row label="Devise" value={store.currency} />
          <Row label="ID tenant" value={store.id} />
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 mb-6">
        <h2 className="font-serif text-xl font-bold">{t("settings.subscription")}</h2>
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          {(["trial", "basic", "pro"] as const).map((plan) => {
            const current = plan === store.subscription.plan;
            return (
              <div
                key={plan}
                className={`p-5 rounded-xl border ${
                  current ? "border-primary bg-primary/5" : "border-border bg-background"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{t(`plans.${plan}`)}</p>
                    <p className="font-serif text-2xl font-bold mt-1 num">€{t(`plans.${plan}Price`)}</p>
                  </div>
                  {current && <span className="text-success"><Check className="size-4" /></span>}
                </div>
                <p className="text-xs text-muted-foreground mt-3">{t(`plans.${plan}Desc`)}</p>
                {current && (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {days > 0 ? t("plans.expiresIn", { days }) : t("plans.expired")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl font-bold">{t("settings.apiConfig")}</h2>
        <p className="text-sm text-muted-foreground mt-2">{t("settings.apiHelp")}</p>
        <div className="mt-4 p-3 rounded-lg bg-surface-alt border border-border">
          <code className="text-xs">VITE_PHP_API_BASE = {import.meta.env.VITE_PHP_API_BASE || "(non défini — mode démo)"}</code>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
