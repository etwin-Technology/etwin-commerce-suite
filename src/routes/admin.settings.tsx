import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Globe, Palette, Settings, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api/client";
import type { PlatformSettings } from "@/lib/api/types";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    api.adminGetSettings()
      .then(setSettings)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      await api.adminUpdateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-white/40 text-sm animate-pulse">
      Chargement des paramètres…
    </div>
  );

  if (!settings) return (
    <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-xl border border-red-500/20">
      {error ?? "Impossible de charger les paramètres."}
    </div>
  );

  const patch = (key: keyof PlatformSettings, val: PlatformSettings[keyof PlatformSettings]) =>
    setSettings(s => s ? { ...s, [key]: val } : s);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Paramètres de la plateforme</h2>
          <p className="text-xs text-white/40 mt-0.5">
            Configuration globale — landing page, plans, textes publics
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl px-5 py-2.5 text-sm font-bold transition-colors disabled:opacity-60"
        >
          {saved ? <Check className="size-4" /> : <Settings className="size-4" />}
          {saved ? "Enregistré !" : saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Maintenance toggle */}
      <Section icon={AlertTriangle} title="Mode maintenance" iconColor="text-red-400 bg-red-500/10">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm text-white font-medium">Activer le mode maintenance</p>
            <p className="text-xs text-white/40 mt-0.5">Affiche une page de maintenance aux visiteurs</p>
          </div>
          <div
            onClick={() => patch("maintenance_mode", !settings.maintenance_mode)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
              settings.maintenance_mode ? "bg-red-500" : "bg-white/10"
            }`}
          >
            <div className={`absolute top-1 size-4 rounded-full bg-white shadow transition-all ${
              settings.maintenance_mode ? "start-6" : "start-1"
            }`} />
          </div>
        </label>
      </Section>

      {/* Platform identity */}
      <Section icon={Settings} title="Identité de la plateforme" iconColor="text-violet-400 bg-violet-500/10">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nom de la plateforme" value={settings.platform_name}
            onChange={v => patch("platform_name", v)} />
          <Field label="Email support" value={settings.support_email ?? ""}
            onChange={v => patch("support_email", v)} type="email" />
          <Field label="WhatsApp support" value={settings.support_whatsapp ?? ""}
            onChange={v => patch("support_whatsapp", v)} placeholder="+212 6 12 34 56 78" dir="ltr" />
        </div>
      </Section>

      {/* Plans */}
      <Section icon={Settings} title="Configuration des plans" iconColor="text-amber-400 bg-amber-500/10">
        <div className="grid sm:grid-cols-3 gap-4">
          <NumField label="Jours d'essai (trial)" value={settings.trial_days}
            onChange={v => patch("trial_days", v)} min={1} max={90} />
          <NumField label="Max produits (trial)" value={settings.max_products_trial}
            onChange={v => patch("max_products_trial", v)} min={1} max={100} />
          <NumField label="Prix Pro (MAD/mois)" value={settings.pricing_price}
            onChange={v => patch("pricing_price", v)} min={0} max={9999} />
        </div>
      </Section>

      {/* Landing page — Hero */}
      <Section icon={Globe} title="Landing page — Hero" iconColor="text-blue-400 bg-blue-500/10">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Badge (Arabe)" value={settings.hero_badge_ar}
              onChange={v => patch("hero_badge_ar", v)} dir="rtl" />
            <Field label="Badge (Français)" value={settings.hero_badge_fr}
              onChange={v => patch("hero_badge_fr", v)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Titre principal (Arabe)" value={settings.hero_title_ar}
              onChange={v => patch("hero_title_ar", v)} dir="rtl" />
            <Field label="Titre principal (Français)" value={settings.hero_title_fr}
              onChange={v => patch("hero_title_fr", v)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Textarea label="Sous-titre (Arabe)" value={settings.hero_subtitle_ar}
              onChange={v => patch("hero_subtitle_ar", v)} dir="rtl" />
            <Textarea label="Sous-titre (Français)" value={settings.hero_subtitle_fr}
              onChange={v => patch("hero_subtitle_fr", v)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="CTA principal (Arabe)" value={settings.hero_cta_ar}
              onChange={v => patch("hero_cta_ar", v)} dir="rtl" />
            <Field label="CTA principal (Français)" value={settings.hero_cta_fr}
              onChange={v => patch("hero_cta_fr", v)} />
          </div>
        </div>
      </Section>

      {/* Footer texts */}
      <Section icon={Palette} title="Footer" iconColor="text-green-400 bg-green-500/10">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Texte footer (Arabe)" value={settings.footer_text_ar}
            onChange={v => patch("footer_text_ar", v)} dir="rtl" />
          <Field label="Texte footer (Français)" value={settings.footer_text_fr}
            onChange={v => patch("footer_text_fr", v)} />
        </div>
      </Section>

      {/* Live preview of landing stats */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
        <p className="text-xs text-white/50 mb-3 font-semibold uppercase tracking-wider">Aperçu du prix landing</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white">{settings.pricing_price}</span>
          <span className="text-white/60 text-sm">{settings.pricing_currency}/mois</span>
          <span className="ms-3 text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-bold">
            {settings.trial_days} jours gratuits
          </span>
        </div>
        <p className="mt-2 text-xs text-white/40">
          Essai : max {settings.max_products_trial} produits · {settings.trial_days} jours
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({
  icon: Icon, title, iconColor, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`size-7 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="size-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, dir, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        dir={dir}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
      />
    </label>
  );
}

function Textarea({
  label, value, onChange, dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">{label}</span>
      <textarea
        value={value}
        dir={dir}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none transition-all"
      />
    </label>
  );
}

function NumField({
  label, value, onChange, min, max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
      />
    </label>
  );
}
