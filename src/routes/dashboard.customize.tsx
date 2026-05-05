import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check, Eye, EyeOff, Palette, LayoutTemplate, AlignLeft, Plus, Trash2,
  Sparkles, Grid3x3, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api/client";
import { ImageUploader } from "@/components/ImageUploader";
import type { MenuLink, StoreFooter, StoreHeader, StoreTheme } from "@/lib/api/types";

export const Route = createFileRoute("/dashboard/customize")({
  component: CustomizePage,
});

// ─── Color presets ───────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  { name: "Violet",   primary: "#7C3AED", secondary: "#EDE9FE", accent: "#F59E0B" },
  { name: "Bleu",     primary: "#2563EB", secondary: "#EFF6FF", accent: "#F59E0B" },
  { name: "Rouge",    primary: "#DC2626", secondary: "#FEF2F2", accent: "#F59E0B" },
  { name: "Vert",     primary: "#16A34A", secondary: "#F0FDF4", accent: "#F59E0B" },
  { name: "Noir",     primary: "#111827", secondary: "#F9FAFB", accent: "#EAB308" },
  { name: "Rose",     primary: "#DB2777", secondary: "#FDF2F8", accent: "#F97316" },
];

const FONT_OPTIONS = [
  { value: "DM Sans",     label: "DM Sans (Moderne)" },
  { value: "Inter",       label: "Inter (Tech)" },
  { value: "Poppins",     label: "Poppins (Friendly)" },
  { value: "Playfair Display", label: "Playfair (Élégant)" },
  { value: "Cairo",       label: "Cairo (Arabe/FR)" },
];

const RADIUS_OPTIONS = [
  { value: "sm",   label: "Carré" },
  { value: "md",   label: "Léger" },
  { value: "lg",   label: "Arrondi" },
  { value: "xl",   label: "Très arrondi" },
  { value: "full", label: "Pilule" },
];

// ─── Tiny reusable components ────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{className?: string}>; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="size-4" />
        </div>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-foreground mb-1.5">{children}</p>;
}

function Input({ value, onChange, placeholder, dir }: { value: string; onChange: (v: string) => void; placeholder?: string; dir?: "ltr" | "rtl" }) {
  return (
    <input
      value={value}
      dir={dir}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function SaveBtn({ loading, saved, onClick }: { loading: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="mt-4 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
    >
      {saved ? <Check className="size-4" /> : null}
      {saved ? "Enregistré !" : loading ? "Sauvegarde…" : "Enregistrer"}
    </button>
  );
}

/** Compact pill-style toggle for boolean display options. */
function Toggle({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-sm text-start transition-colors ${
        checked ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/30 bg-card"
      }`}
    >
      <span className="font-medium text-xs">{label}</span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[18px] rtl:-translate-x-[18px]" : "translate-x-0.5 rtl:-translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

// ─── Live Preview Mini-Component ─────────────────────────────────────────────
function StorePreview({ theme, header, storeName }: {
  theme: StoreTheme;
  header: StoreHeader;
  storeName: string;
}) {
  const radius = theme.borderRadius === "full" ? "9999px" : theme.borderRadius === "xl" ? "16px" : theme.borderRadius === "lg" ? "12px" : theme.borderRadius === "md" ? "8px" : "4px";

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-border shadow-lg bg-gray-50 text-xs" style={{ fontFamily: theme.fontFamily }}>
      {/* Header preview */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: theme.primaryColor }}>
        <span className="font-bold text-white text-sm">{header.logoUrl ? "🏪" : ""} {storeName}</span>
        <div className="flex gap-2">
          {(header.menuLinks || []).slice(0, 3).map((l, i) => (
            <span key={i} className="text-white/80 text-[10px]">{l.label}</span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="px-4 py-6 text-center" style={{ backgroundColor: theme.secondaryColor }}>
        <p className="font-bold text-sm" style={{ color: theme.primaryColor }}>Bienvenue sur {storeName}</p>
        <p className="text-xs text-gray-500 mt-0.5">Découvrez nos produits</p>
        <button
          className="mt-2 px-4 py-1.5 text-white text-[10px] font-bold"
          style={{ backgroundColor: theme.accentColor, borderRadius: radius }}
        >
          Voir les produits
        </button>
      </div>

      {/* Product grid mock */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg overflow-hidden border border-gray-100">
            <div className="h-16 bg-gray-200 flex items-center justify-center text-xl">🛍️</div>
            <div className="p-2">
              <p className="font-medium text-[9px] truncate">Produit {i}</p>
              <p className="font-bold text-[10px] mt-0.5" style={{ color: theme.primaryColor }}>299 MAD</p>
              <button
                className="w-full mt-1 py-0.5 text-white text-[9px]"
                style={{ backgroundColor: theme.primaryColor, borderRadius: radius }}
              >
                Acheter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function CustomizePage() {
  const { store, refreshStore } = useAuth();
  const [showPreview, setShowPreview] = useState(true);

  // Theme
  const defaultTheme: StoreTheme = {
    primaryColor:   "#7C3AED",
    secondaryColor: "#EDE9FE",
    accentColor:    "#F59E0B",
    fontFamily:     "DM Sans",
    borderRadius:   "lg",
  };
  const [theme, setTheme] = useState<StoreTheme>({ ...defaultTheme, ...(store?.theme ?? {}) });
  const [savingTheme, setSavingTheme] = useState(false);
  const [savedTheme, setSavedTheme]   = useState(false);

  // Header
  const defaultHeader: StoreHeader = {
    logoUrl: store?.logoUrl ?? null,
    menuLinks: [],
    showSearch: false,
    announcementBar: false,
    announcementText: "",
    bannerImageUrl: null,
    heroTitle: store?.name ?? "",
    heroSubtitle: "",
    heroCta: "",
    productColumns: 3,
    showTrustBar: true,
    showLiveBuyer: true,
    showRatings: true,
    showScarcity: true,
  };
  const [header, setHeader]   = useState<StoreHeader>({ ...defaultHeader, ...(store?.header ?? {}) });
  const [savingHeader, setSavingHeader] = useState(false);
  const [savedHeader, setSavedHeader]   = useState(false);

  // Footer
  const defaultFooter: StoreFooter = { description: "", links: [], socials: { facebook: "", instagram: "", tiktok: "", youtube: "" }, showPoweredBy: true };
  const [footer, setFooter]   = useState<StoreFooter>({ ...defaultFooter, ...(store?.footer ?? {}) });
  const [savingFooter, setSavingFooter] = useState(false);
  const [savedFooter, setSavedFooter]   = useState(false);

  if (!store) return null;

  const saveTheme = async () => {
    setSavingTheme(true);
    try {
      const updated = await api.updateTheme(store.id, theme);
      refreshStore(updated);
      setSavedTheme(true);
      setTimeout(() => setSavedTheme(false), 2000);
    } finally { setSavingTheme(false); }
  };

  const saveHeader = async () => {
    setSavingHeader(true);
    try {
      const updated = await api.updateHeader(store.id, header);
      refreshStore(updated);
      setSavedHeader(true);
      toast.success("En-tête enregistré");
      setTimeout(() => setSavedHeader(false), 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally { setSavingHeader(false); }
  };

  const saveFooter = async () => {
    setSavingFooter(true);
    try {
      const updated = await api.updateFooter(store.id, footer);
      refreshStore(updated);
      setSavedFooter(true);
      setTimeout(() => setSavedFooter(false), 2000);
    } finally { setSavingFooter(false); }
  };

  const addMenuLink = () => setHeader(h => ({ ...h, menuLinks: [...(h.menuLinks ?? []), { label: "", url: "" }] }));
  const updateMenuLink = (i: number, field: keyof MenuLink, val: string) =>
    setHeader(h => {
      const links = [...(h.menuLinks ?? [])];
      links[i] = { ...links[i], [field]: val };
      return { ...h, menuLinks: links };
    });
  const removeMenuLink = (i: number) =>
    setHeader(h => ({ ...h, menuLinks: (h.menuLinks ?? []).filter((_, j) => j !== i) }));

  const addFooterLink = () => setFooter(f => ({ ...f, links: [...(f.links ?? []), { label: "", url: "" }] }));
  const updateFooterLink = (i: number, field: keyof MenuLink, val: string) =>
    setFooter(f => {
      const links = [...(f.links ?? [])];
      links[i] = { ...links[i], [field]: val };
      return { ...f, links };
    });
  const removeFooterLink = (i: number) =>
    setFooter(f => ({ ...f, links: (f.links ?? []).filter((_, j) => j !== i) }));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Personnaliser la boutique</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Modifiez le hero, les couleurs, le contenu et l'affichage des produits.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/store/$slug"
            params={{ slug: store.slug }}
            target="_blank"
            className="flex items-center gap-2 text-sm bg-primary text-primary-foreground rounded-full px-4 py-2 hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="size-4" />
            Voir la boutique
          </Link>
          <button
            onClick={() => setShowPreview(v => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-full px-4 py-2 hover:bg-accent transition-colors"
          >
            {showPreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {showPreview ? "Masquer" : "Aperçu"}
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1"}`}>
        {/* Left: settings panels */}
        <div className="space-y-5">

          {/* ── Theme ────────────────────────────────────────────────────── */}
          <SectionCard title="Thème & Couleurs" icon={Palette}>
            {/* Color presets */}
            <Label>Palette de couleurs</Label>
            <div className="flex flex-wrap gap-2 mb-4">
              {COLOR_PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => setTheme(t => ({ ...t, primaryColor: p.primary, secondaryColor: p.secondary, accentColor: p.accent }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    theme.primaryColor === p.primary ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="size-3 rounded-full" style={{ backgroundColor: p.primary }} />
                  {p.name}
                </button>
              ))}
            </div>

            {/* Custom colors */}
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              {[
                { key: "primaryColor",   label: "Couleur principale" },
                { key: "secondaryColor", label: "Couleur secondaire" },
                { key: "accentColor",    label: "Couleur d'accent" },
              ].map(({ key, label }) => (
                <label key={key} className="block">
                  <Label>{label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={(theme as unknown as Record<string, string>)[key]}
                      onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))}
                      className="size-9 rounded-lg border border-input cursor-pointer p-0.5 bg-transparent"
                    />
                    <input
                      type="text"
                      value={(theme as unknown as Record<string, string>)[key]}
                      onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))}
                      className="flex-1 px-2 py-2 rounded-lg border border-input bg-background text-xs font-mono focus:outline-none"
                    />
                  </div>
                </label>
              ))}
            </div>

            {/* Font */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Police de caractère</Label>
                <select
                  value={theme.fontFamily}
                  onChange={e => setTheme(t => ({ ...t, fontFamily: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none"
                >
                  {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Arrondi des boutons</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {RADIUS_OPTIONS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setTheme(t => ({ ...t, borderRadius: r.value as StoreTheme["borderRadius"] }))}
                      className={`px-3 py-1.5 text-xs font-medium border rounded transition-colors ${
                        theme.borderRadius === r.value ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"
                      }`}
                      style={{ borderRadius: r.value === "full" ? "999px" : r.value === "xl" ? "16px" : r.value === "lg" ? "12px" : r.value === "md" ? "8px" : "4px" }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <SaveBtn loading={savingTheme} saved={savedTheme} onClick={saveTheme} />
            </div>
          </SectionCard>

          {/* ── Hero banner ───────────────────────────────────────────────── */}
          <SectionCard title="Bannière & Hero" icon={Sparkles}>
            <div className="space-y-4">
              <div>
                <Label>Image de bannière (optionnel)</Label>
                <ImageUploader
                  value={header.bannerImageUrl ?? null}
                  onChange={(url) => setHeader(h => ({ ...h, bannerImageUrl: url ?? null }))}
                  aspect="wide"
                  label="Cliquer pour choisir une image (1600 × 600 idéal)"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Si vide, un dégradé de votre couleur principale est utilisé.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Titre principal</Label>
                  <Input
                    value={header.heroTitle ?? ""}
                    onChange={v => setHeader(h => ({ ...h, heroTitle: v }))}
                    placeholder={store.name}
                  />
                </div>
                <div>
                  <Label>Bouton d'appel à l'action (optionnel)</Label>
                  <Input
                    value={header.heroCta ?? ""}
                    onChange={v => setHeader(h => ({ ...h, heroCta: v }))}
                    placeholder="Voir les produits"
                  />
                </div>
              </div>

              <div>
                <Label>Sous-titre</Label>
                <textarea
                  value={header.heroSubtitle ?? ""}
                  onChange={e => setHeader(h => ({ ...h, heroSubtitle: e.target.value }))}
                  placeholder="Découvrez nos produits — paiement à la livraison."
                  rows={2}
                  maxLength={200}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <SaveBtn loading={savingHeader} saved={savedHeader} onClick={saveHeader} />
            </div>
          </SectionCard>

          {/* ── Display options ──────────────────────────────────────────── */}
          <SectionCard title="Affichage & Mise en page" icon={Grid3x3}>
            <div className="space-y-5">
              <div>
                <Label>Colonnes de produits (sur grand écran)</Label>
                <div className="flex gap-2">
                  {[2, 3, 4].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setHeader(h => ({ ...h, productColumns: n as 2 | 3 | 4 }))}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                        (header.productColumns ?? 3) === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {n} colonnes
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Éléments d'ambiance</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  <Toggle
                    label="Barre de confiance (livraison, COD)"
                    checked={header.showTrustBar !== false}
                    onChange={v => setHeader(h => ({ ...h, showTrustBar: v }))}
                  />
                  <Toggle
                    label="Pulsation « X a commandé »"
                    checked={header.showLiveBuyer !== false}
                    onChange={v => setHeader(h => ({ ...h, showLiveBuyer: v }))}
                  />
                  <Toggle
                    label="Bloc avis clients (4.8★)"
                    checked={header.showRatings !== false}
                    onChange={v => setHeader(h => ({ ...h, showRatings: v }))}
                  />
                  <Toggle
                    label="Badges « Plus que N en stock »"
                    checked={header.showScarcity !== false}
                    onChange={v => setHeader(h => ({ ...h, showScarcity: v }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <SaveBtn loading={savingHeader} saved={savedHeader} onClick={saveHeader} />
            </div>
          </SectionCard>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <SectionCard title="En-tête (Header)" icon={LayoutTemplate}>
            <div className="space-y-4">
              <div>
                <Label>URL du logo</Label>
                <Input value={header.logoUrl ?? ""} onChange={v => setHeader(h => ({ ...h, logoUrl: v || null }))} placeholder="https://…/logo.png" dir="ltr" />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showSearch"
                  checked={header.showSearch}
                  onChange={e => setHeader(h => ({ ...h, showSearch: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="showSearch" className="text-sm cursor-pointer">Afficher la barre de recherche</label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="announcementBar"
                  checked={header.announcementBar ?? false}
                  onChange={e => setHeader(h => ({ ...h, announcementBar: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="announcementBar" className="text-sm cursor-pointer">Barre d'annonce</label>
              </div>

              {header.announcementBar && (
                <div>
                  <Label>Texte de l'annonce</Label>
                  <Input value={header.announcementText ?? ""} onChange={v => setHeader(h => ({ ...h, announcementText: v }))} placeholder="🚀 Livraison gratuite dès 200 MAD !" />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Liens du menu</Label>
                  <button onClick={addMenuLink} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Plus className="size-3.5" /> Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {(header.menuLinks ?? []).map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={link.label} onChange={v => updateMenuLink(i, "label", v)} placeholder="Label" />
                      <Input value={link.url}   onChange={v => updateMenuLink(i, "url",   v)} placeholder="URL" dir="ltr" />
                      <button onClick={() => removeMenuLink(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  {(header.menuLinks ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">Aucun lien ajouté</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <SaveBtn loading={savingHeader} saved={savedHeader} onClick={saveHeader} />
            </div>
          </SectionCard>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <SectionCard title="Pied de page (Footer)" icon={AlignLeft}>
            <div className="space-y-4">
              <div>
                <Label>Description courte</Label>
                <textarea
                  value={footer.description ?? ""}
                  onChange={e => setFooter(f => ({ ...f, description: e.target.value }))}
                  placeholder="Votre boutique en ligne — Paiement à la livraison."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Liens du footer</Label>
                  <button onClick={addFooterLink} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Plus className="size-3.5" /> Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {(footer.links ?? []).map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={link.label} onChange={v => updateFooterLink(i, "label", v)} placeholder="Politique de confidentialité" />
                      <Input value={link.url}   onChange={v => updateFooterLink(i, "url",   v)} placeholder="/privacy" dir="ltr" />
                      <button onClick={() => removeFooterLink(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Réseaux sociaux</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(["facebook","instagram","tiktok","youtube"] as const).map(s => (
                    <label key={s} className="block">
                      <span className="text-xs text-muted-foreground capitalize">{s}</span>
                      <Input
                        value={(footer.socials ?? {})[s] ?? ""}
                        onChange={v => setFooter(f => ({ ...f, socials: { ...(f.socials ?? {}), [s]: v } }))}
                        placeholder={`https://${s}.com/votre-page`}
                        dir="ltr"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="poweredBy"
                  checked={footer.showPoweredBy ?? true}
                  onChange={e => setFooter(f => ({ ...f, showPoweredBy: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="poweredBy" className="text-sm cursor-pointer">Afficher "Propulsé par ETWIN"</label>
              </div>
            </div>
            <div className="flex justify-end">
              <SaveBtn loading={savingFooter} saved={savedFooter} onClick={saveFooter} />
            </div>
          </SectionCard>
        </div>

        {/* Right: live preview */}
        {showPreview && (
          <div className="space-y-4">
            <div className="sticky top-20">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Aperçu en direct</span>
              </div>
              <StorePreview theme={theme} header={header} storeName={store.name} />
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                L'aperçu est indicatif. Visitez votre boutique pour le rendu final.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
