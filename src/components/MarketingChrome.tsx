import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Menu, X, Facebook, Instagram, Youtube, Mail, Phone, MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLandingContent, type Lang } from "@/lib/landing";

function useLang(): Lang {
  const { i18n } = useTranslation();
  return (i18n.resolvedLanguage === "ar" ? "ar" : "fr") as Lang;
}

export function MarketingHeader() {
  const { t } = useTranslation();
  const lang = useLang();
  const c = useLandingContent(lang);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAr = lang === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // lock body scroll when menu open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all ${
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-background/60 backdrop-blur"
      }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-10 h-16">
        <Link to="/" className="flex items-baseline gap-2 shrink-0" onClick={() => setOpen(false)}>
          <span className="font-serif text-xl sm:text-2xl font-bold text-primary tracking-tight">ETWIN</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden xs:inline">Commerce</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm text-muted-foreground">
          {c.navLinks.map((l) => (
            <a key={l.label} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher subtle />
          <Link
            to="/login"
            className="hidden sm:inline-flex text-sm font-medium text-foreground hover:text-primary px-3 py-1.5"
          >
            {t("nav.login")}
          </Link>
          <Link
            to="/register"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground rounded-full px-4 py-2 hover:bg-primary/90 transition-colors shadow-sm"
          >
            {t("nav.signup")}
            <Arrow className="size-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center size-10 rounded-lg border border-border bg-card text-foreground"
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden fixed inset-x-0 top-16 bottom-0 z-30 bg-background border-t border-border transition-transform duration-200 ${
          open ? "translate-y-0" : "-translate-y-[120%]"
        }`}
        aria-hidden={!open}
      >
        <div className="h-full overflow-y-auto px-5 py-6 flex flex-col">
          <nav className="flex flex-col gap-1">
            {c.navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-muted"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-border flex flex-col gap-3">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="w-full text-center px-4 py-3 rounded-xl border border-border text-sm font-semibold"
            >
              {t("nav.login")}
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              {t("nav.signup")}
              <Arrow className="size-4" />
            </Link>
          </div>

          <div className="mt-auto pt-8 flex items-center gap-3 text-muted-foreground">
            {c.social.facebook && <a href={c.social.facebook} aria-label="Facebook" className="size-10 rounded-full border border-border flex items-center justify-center hover:text-foreground"><Facebook className="size-4" /></a>}
            {c.social.instagram && <a href={c.social.instagram} aria-label="Instagram" className="size-10 rounded-full border border-border flex items-center justify-center hover:text-foreground"><Instagram className="size-4" /></a>}
            {c.social.youtube && <a href={c.social.youtube} aria-label="YouTube" className="size-10 rounded-full border border-border flex items-center justify-center hover:text-foreground"><Youtube className="size-4" /></a>}
          </div>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  const lang = useLang();
  const c = useLandingContent(lang);

  return (
    <footer className="mt-24 bg-surface-alt border-t border-border">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10 py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-primary tracking-tight">ETWIN</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Commerce</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-sm">{c.footerTagline}</p>

            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {c.contactEmail && (
                <li className="flex items-center gap-2"><Mail className="size-4 shrink-0" /> <a href={`mailto:${c.contactEmail}`} className="hover:text-foreground">{c.contactEmail}</a></li>
              )}
              {c.contactPhone && (
                <li className="flex items-center gap-2"><Phone className="size-4 shrink-0" /> <a href={`tel:${c.contactPhone.replace(/\s/g, '')}`} className="hover:text-foreground num">{c.contactPhone}</a></li>
              )}
              {c.contactAddress && (
                <li className="flex items-center gap-2"><MapPin className="size-4 shrink-0" /> <span>{c.contactAddress}</span></li>
              )}
            </ul>

            <div className="mt-6 flex items-center gap-2">
              {c.social.facebook && <a href={c.social.facebook} aria-label="Facebook" className="size-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"><Facebook className="size-4" /></a>}
              {c.social.instagram && <a href={c.social.instagram} aria-label="Instagram" className="size-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"><Instagram className="size-4" /></a>}
              {c.social.youtube && <a href={c.social.youtube} aria-label="YouTube" className="size-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"><Youtube className="size-4" /></a>}
              {c.social.tiktok && <a href={c.social.tiktok} aria-label="TikTok" className="size-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-xs font-bold">TT</a>}
              {c.social.whatsapp && <a href={c.social.whatsapp} aria-label="WhatsApp" className="size-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-xs font-bold">WA</a>}
            </div>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {c.footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-foreground/80">{col.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>{c.footerCopyright}</p>
          <p className="text-[11px]">Made with care · 🇲🇦</p>
        </div>
      </div>
    </footer>
  );
}
