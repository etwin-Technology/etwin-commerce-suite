import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Save, RotateCcw, Plus, Trash2, ExternalLink, Eye } from "lucide-react";
import {
  defaults, loadLanding, saveLanding, resetLanding,
  type Lang, type LandingContent, type LandingFeature,
  type LandingTestimonial, type LandingFaq, type LandingNavLink,
} from "@/lib/landing";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/landing")({
  component: LandingEditor,
});

function LandingEditor() {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState<Lang>(((i18n.resolvedLanguage === "ar" ? "ar" : "fr") as Lang));
  const [content, setContent] = useState<LandingContent>(() => loadLanding(lang));
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => { setContent(loadLanding(lang)); setSavedAt(null); }, [lang]);

  const dirty = useMemo(() => JSON.stringify(content) !== JSON.stringify(loadLanding(lang)), [content, lang]);

  const update = <K extends keyof LandingContent>(key: K, value: LandingContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  const onSave = () => {
    saveLanding(lang, content);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  };
  const onReset = () => {
    if (!confirm("Restore default content for this language?")) return;
    resetLanding(lang);
    setContent(defaults[lang]);
  };

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Landing Page Editor</h1>
          <p className="mt-1 text-sm text-muted-foreground">Edit every section visible on your public landing page.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" target="_blank" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted">
            <Eye className="size-4" /> Preview
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </Link>
          <button onClick={onReset} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted">
            <RotateCcw className="size-4" /> Reset
          </button>
          <button
            onClick={onSave}
            disabled={!dirty}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="size-4" /> {savedAt ? "Saved ✓" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Lang switch */}
      <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-card">
        {(["ar", "fr"] as const).map((l) => (
          <button
            key={l}
            onClick={() => {
              if (dirty && !confirm("Discard unsaved changes?")) return;
              setLang(l);
            }}
            className={`px-4 py-1.5 text-sm font-medium rounded-full ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {l === "ar" ? "العربية (RTL)" : "Français"}
          </button>
        ))}
      </div>

      {/* HERO */}
      <Section title="Hero">
        <Field label="Top badge"><Input value={content.badge} onChange={(v) => update("badge", v)} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Hero title"><Input value={content.heroTitle} onChange={(v) => update("heroTitle", v)} /></Field>
          <Field label="Highlighted phrase"><Input value={content.heroHighlight} onChange={(v) => update("heroHighlight", v)} /></Field>
        </div>
        <Field label="Subtitle"><Textarea value={content.heroSubtitle} onChange={(v) => update("heroSubtitle", v)} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Primary CTA"><Input value={content.ctaPrimary} onChange={(v) => update("ctaPrimary", v)} /></Field>
          <Field label="Secondary CTA"><Input value={content.ctaSecondary} onChange={(v) => update("ctaSecondary", v)} /></Field>
        </div>
        <Field label="CTA note"><Input value={content.ctaNote} onChange={(v) => update("ctaNote", v)} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Trust counter"><Input value={content.trustCounter} onChange={(v) => update("trustCounter", v)} /></Field>
          <Field label="Guarantee"><Input value={content.guarantee} onChange={(v) => update("guarantee", v)} /></Field>
        </div>
        <Field label="Demo button label"><Input value={content.watchDemo} onChange={(v) => update("watchDemo", v)} /></Field>

        <SubTitle>Hero stats (4)</SubTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          {content.heroStats.map((s, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <Input placeholder="Value" value={s.value} onChange={(v) => {
                const arr = [...content.heroStats]; arr[i] = { ...s, value: v }; update("heroStats", arr);
              }} />
              <Input placeholder="Label" value={s.label} onChange={(v) => {
                const arr = [...content.heroStats]; arr[i] = { ...s, label: v }; update("heroStats", arr);
              }} />
            </div>
          ))}
        </div>
      </Section>

      {/* HEADER NAV */}
      <Section title="Header navigation">
        <ListEditor<LandingNavLink>
          items={content.navLinks}
          onChange={(arr) => update("navLinks", arr)}
          newItem={() => ({ label: "New link", href: "#" })}
          render={(item, set) => (
            <div className="grid sm:grid-cols-2 gap-2">
              <Input placeholder="Label" value={item.label} onChange={(v) => set({ ...item, label: v })} />
              <Input placeholder="#anchor or /url" value={item.href} onChange={(v) => set({ ...item, href: v })} />
            </div>
          )}
        />
      </Section>

      {/* HOW */}
      <Section title="How it works">
        <Field label="Title"><Input value={content.howTitle} onChange={(v) => update("howTitle", v)} /></Field>
        <Field label="Subtitle"><Input value={content.howSubtitle} onChange={(v) => update("howSubtitle", v)} /></Field>
        <ListEditor
          items={content.steps}
          onChange={(arr) => update("steps", arr)}
          newItem={() => ({ title: "New step", desc: "" })}
          render={(item, set) => (
            <div className="space-y-2">
              <Input placeholder="Title" value={item.title} onChange={(v) => set({ ...item, title: v })} />
              <Textarea placeholder="Description" value={item.desc} onChange={(v) => set({ ...item, desc: v })} />
            </div>
          )}
        />
      </Section>

      {/* FEATURES */}
      <Section title="Features">
        <Field label="Title"><Input value={content.featuresTitle} onChange={(v) => update("featuresTitle", v)} /></Field>
        <Field label="Subtitle"><Input value={content.featuresSubtitle} onChange={(v) => update("featuresSubtitle", v)} /></Field>
        <ListEditor<LandingFeature>
          items={content.features}
          onChange={(arr) => update("features", arr)}
          newItem={() => ({ icon: "sparkles", title: "New feature", desc: "" })}
          render={(item, set) => (
            <div className="space-y-2">
              <div className="grid sm:grid-cols-[160px_1fr] gap-2">
                <select
                  value={item.icon}
                  onChange={(e) => set({ ...item, icon: e.target.value })}
                  className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  {["zap","message-circle","truck","bell","smartphone","shield-check","sparkles","rocket"].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <Input placeholder="Title" value={item.title} onChange={(v) => set({ ...item, title: v })} />
              </div>
              <Textarea placeholder="Description" value={item.desc} onChange={(v) => set({ ...item, desc: v })} />
            </div>
          )}
        />
      </Section>

      {/* TESTIMONIALS */}
      <Section title="Testimonials">
        <Field label="Title"><Input value={content.testimonialsTitle} onChange={(v) => update("testimonialsTitle", v)} /></Field>
        <Field label="Subtitle"><Input value={content.testimonialsSubtitle} onChange={(v) => update("testimonialsSubtitle", v)} /></Field>
        <ListEditor<LandingTestimonial>
          items={content.testimonials}
          onChange={(arr) => update("testimonials", arr)}
          newItem={() => ({ name: "Name", city: "City", quote: "", revenue: "", initials: "NA" })}
          render={(item, set) => (
            <div className="space-y-2">
              <div className="grid sm:grid-cols-3 gap-2">
                <Input placeholder="Name" value={item.name} onChange={(v) => set({ ...item, name: v })} />
                <Input placeholder="City" value={item.city} onChange={(v) => set({ ...item, city: v })} />
                <Input placeholder="Initials" value={item.initials} onChange={(v) => set({ ...item, initials: v })} />
              </div>
              <Input placeholder="Revenue" value={item.revenue} onChange={(v) => set({ ...item, revenue: v })} />
              <Textarea placeholder="Quote" value={item.quote} onChange={(v) => set({ ...item, quote: v })} />
            </div>
          )}
        />
      </Section>

      {/* PRICING */}
      <Section title="Pricing">
        <Field label="Title"><Input value={content.pricingTitle} onChange={(v) => update("pricingTitle", v)} /></Field>
        <Field label="Subtitle"><Input value={content.pricingSubtitle} onChange={(v) => update("pricingSubtitle", v)} /></Field>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Price"><Input value={content.pricingPrice} onChange={(v) => update("pricingPrice", v)} /></Field>
          <Field label="Currency"><Input value={content.pricingCurrency} onChange={(v) => update("pricingCurrency", v)} /></Field>
          <Field label="Period"><Input value={content.pricingPeriod} onChange={(v) => update("pricingPeriod", v)} /></Field>
        </div>
        <Field label="CTA"><Input value={content.pricingCta} onChange={(v) => update("pricingCta", v)} /></Field>
        <SubTitle>Plan features</SubTitle>
        <ListEditor<string>
          items={content.pricingFeatures}
          onChange={(arr) => update("pricingFeatures", arr)}
          newItem={() => "New feature"}
          render={(item, set) => <Input value={item} onChange={set} />}
        />
      </Section>

      {/* FAQ */}
      <Section title="FAQ">
        <Field label="Title"><Input value={content.faqTitle} onChange={(v) => update("faqTitle", v)} /></Field>
        <ListEditor<LandingFaq>
          items={content.faqs}
          onChange={(arr) => update("faqs", arr)}
          newItem={() => ({ q: "Question?", a: "Answer." })}
          render={(item, set) => (
            <div className="space-y-2">
              <Input placeholder="Question" value={item.q} onChange={(v) => set({ ...item, q: v })} />
              <Textarea placeholder="Answer" value={item.a} onChange={(v) => set({ ...item, a: v })} />
            </div>
          )}
        />
      </Section>

      {/* CTA section */}
      <Section title="Bottom CTA section">
        <Field label="Title"><Input value={content.ctaSectionTitle} onChange={(v) => update("ctaSectionTitle", v)} /></Field>
        <Field label="Subtitle"><Input value={content.ctaSectionSub} onChange={(v) => update("ctaSectionSub", v)} /></Field>
      </Section>

      {/* FOOTER */}
      <Section title="Footer">
        <Field label="Tagline"><Textarea value={content.footerTagline} onChange={(v) => update("footerTagline", v)} /></Field>
        <Field label="Copyright"><Input value={content.footerCopyright} onChange={(v) => update("footerCopyright", v)} /></Field>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Email"><Input value={content.contactEmail} onChange={(v) => update("contactEmail", v)} /></Field>
          <Field label="Phone"><Input value={content.contactPhone} onChange={(v) => update("contactPhone", v)} /></Field>
          <Field label="Address"><Input value={content.contactAddress} onChange={(v) => update("contactAddress", v)} /></Field>
        </div>

        <SubTitle>Social URLs</SubTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Facebook"><Input value={content.social.facebook ?? ""} onChange={(v) => update("social", { ...content.social, facebook: v })} /></Field>
          <Field label="Instagram"><Input value={content.social.instagram ?? ""} onChange={(v) => update("social", { ...content.social, instagram: v })} /></Field>
          <Field label="TikTok"><Input value={content.social.tiktok ?? ""} onChange={(v) => update("social", { ...content.social, tiktok: v })} /></Field>
          <Field label="YouTube"><Input value={content.social.youtube ?? ""} onChange={(v) => update("social", { ...content.social, youtube: v })} /></Field>
          <Field label="WhatsApp link"><Input value={content.social.whatsapp ?? ""} onChange={(v) => update("social", { ...content.social, whatsapp: v })} /></Field>
        </div>

        <SubTitle>Footer columns</SubTitle>
        <ListEditor
          items={content.footerColumns}
          onChange={(arr) => update("footerColumns", arr)}
          newItem={() => ({ title: "New column", links: [] })}
          render={(col, set) => (
            <div className="space-y-2">
              <Input placeholder="Column title" value={col.title} onChange={(v) => set({ ...col, title: v })} />
              <div className="ms-4 space-y-2">
                {col.links.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input placeholder="Label" value={l.label} onChange={(v) => {
                      const links = [...col.links]; links[i] = { ...l, label: v }; set({ ...col, links });
                    }} />
                    <Input placeholder="URL" value={l.href} onChange={(v) => {
                      const links = [...col.links]; links[i] = { ...l, href: v }; set({ ...col, links });
                    }} />
                    <button onClick={() => set({ ...col, links: col.links.filter((_, idx) => idx !== i) })} className="size-9 rounded-lg border border-border hover:bg-muted text-destructive" aria-label="Remove link"><Trash2 className="size-4 mx-auto" /></button>
                  </div>
                ))}
                <button onClick={() => set({ ...col, links: [...col.links, { label: "New link", href: "#" }] })} className="text-xs font-medium text-primary inline-flex items-center gap-1"><Plus className="size-3.5" /> Add link</button>
              </div>
            </div>
          )}
        />
      </Section>

      {/* Sticky save bar on mobile */}
      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={onSave}
          disabled={!dirty}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-elegant hover:bg-primary/90 disabled:opacity-60"
        >
          <Save className="size-4" /> {savedAt ? "Saved ✓" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

/* ----------------- Primitive editor UI ----------------- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-7 space-y-4">
      <h2 className="font-serif text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}
function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}
function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
    />
  );
}

function ListEditor<T>({ items, onChange, render, newItem }: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, set: (v: T) => void) => React.ReactNode;
  newItem: () => T;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-border bg-background p-3 sm:p-4 relative">
          {render(item, (v) => { const arr = [...items]; arr[i] = v; onChange(arr); })}
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="absolute top-2 end-2 size-7 rounded-md hover:bg-muted text-destructive"
            aria-label="Remove"
          >
            <Trash2 className="size-3.5 mx-auto" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, newItem()])}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30"
      >
        <Plus className="size-3.5" /> Add
      </button>
    </div>
  );
}
