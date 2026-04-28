import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Check, MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { store, refreshStore } = useAuth();
  const [whatsapp, setWhatsapp] = useState(store?.notifications.whatsappNumber || "");
  const [city, setCity] = useState(store?.city || "");
  const [fbPixel, setFbPixel] = useState(store?.tracking.facebookPixel || "");
  const [tiktokPixel, setTiktokPixel] = useState(store?.tracking.tiktokPixel || "");
  const [saved, setSaved] = useState<"info" | "notif" | "track" | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  if (!store) return null;
  const days = Math.max(0, Math.ceil((new Date(store.subscription.expiresAt).getTime() - Date.now()) / 86400000));

  const save = async (which: "info" | "notif" | "track") => {
    setSavingKey(which);
    try {
      const updated = await api.updateStore(store.id, {
        city,
        notifications: { ...store.notifications, whatsappNumber: whatsapp },
        tracking: { facebookPixel: fbPixel || null, tiktokPixel: tiktokPixel || null },
      });
      refreshStore(updated);
      setSaved(which);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSavingKey(null);
    }
  };

  const connectTelegram = async () => {
    // Mock: in production, this opens t.me/EtwinBot?start=<storeId> and the bot updates DB
    const mockChatId = `tg_${Math.random().toString(36).slice(2, 10)}`;
    const updated = await api.updateStore(store.id, {
      notifications: { ...store.notifications, telegramChatId: mockChatId },
    });
    refreshStore(updated);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
      </div>

      {/* Store info */}
      <Card title={t("settings.storeInfo")}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Row label="Nom" value={store.name} />
          <Row label="URL" value={`/store/${store.slug}`} />
          <Field label={t("onboarding.city")} value={city} onChange={setCity} />
        </div>
        <SaveButton onClick={() => save("info")} loading={savingKey === "info"} saved={saved === "info"} />
      </Card>

      {/* Notifications */}
      <Card title={t("settings.notifications")} subtitle={t("settings.notifSub")}>
        <div className="space-y-4">
          <Field label={t("settings.whatsappNumber")} value={whatsapp} onChange={setWhatsapp} dir="ltr" placeholder="+212 6 12 34 56 78" icon={MessageCircle} />

          <div className="p-4 rounded-xl border border-border bg-surface-alt">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Send className="size-5" /></div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Telegram</p>
                {store.notifications.telegramChatId ? (
                  <p className="text-xs text-success font-medium mt-0.5">{t("settings.telegramConnected")}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Recevoir chaque commande sur Telegram avec [Confirmer] [Annuler].</p>
                )}
              </div>
              {!store.notifications.telegramChatId && (
                <button onClick={connectTelegram} className="text-xs font-semibold bg-primary text-primary-foreground rounded-full px-3.5 py-1.5 hover:bg-primary/90 shrink-0">
                  {t("settings.telegramConnect")}
                </button>
              )}
            </div>
          </div>
        </div>
        <SaveButton onClick={() => save("notif")} loading={savingKey === "notif"} saved={saved === "notif"} />
      </Card>

      {/* Pixels */}
      <Card title={t("settings.tracking")} subtitle="Track tes campagnes pub dès le premier jour.">
        <div className="space-y-3">
          <Field label={t("settings.fbPixel")} value={fbPixel} onChange={setFbPixel} placeholder="123456789012345" dir="ltr" />
          <Field label={t("settings.tiktokPixel")} value={tiktokPixel} onChange={setTiktokPixel} placeholder="C12ABC34DE56FG78H" dir="ltr" />
        </div>
        <SaveButton onClick={() => save("track")} loading={savingKey === "track"} saved={saved === "track"} />
      </Card>

      {/* Subscription */}
      <Card title={t("settings.subscription")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-2xl font-bold">
              {t(`plans.${store.subscription.plan}`)} <span className="text-sm text-muted-foreground font-sans font-normal">· 99 MAD/mois</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {days > 0 ? t("plans.expiresIn", { days }) : t("plans.expired")}
            </p>
          </div>
          <span className="text-[11px] font-bold bg-ochre text-foreground px-2.5 py-1 rounded-full">{t("plans.trialBadge")}</span>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 mb-5">
      <h2 className="font-serif text-xl font-bold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-sm">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  dir,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground mb-1.5 block">{label}</span>
      <div className="relative">
        {Icon && <Icon className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />}
        <input
          value={value}
          dir={dir}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring ${Icon ? "ps-9 pe-3" : "px-3.5"}`}
        />
      </div>
    </label>
  );
}

function SaveButton({ onClick, loading, saved }: { onClick: () => void; loading: boolean; saved: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="mt-5 flex justify-end">
      <button
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
      >
        {saved && <Check className="size-4" />}
        {saved ? t("settings.saved") : loading ? t("common.loading") : t("settings.save")}
      </button>
    </div>
  );
}
