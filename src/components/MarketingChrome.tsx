import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function MarketingHeader() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 lg:px-10 h-16">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl font-bold text-primary tracking-tight">ETWIN</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Commerce</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">{t("nav.features")}</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">{t("nav.pricing")}</a>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher subtle />
          <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-foreground hover:text-primary px-3 py-1.5">
            {t("nav.login")}
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center text-sm font-medium bg-primary text-primary-foreground rounded-full px-4 py-2 hover:bg-primary/90 transition-colors"
          >
            {t("nav.signup")}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
        <p>{t("landing.footer")}</p>
        <div className="flex items-center gap-6">
          <Link to="/login" className="hover:text-foreground">{t("nav.login")}</Link>
          <Link to="/register" className="hover:text-foreground">{t("nav.signup")}</Link>
        </div>
      </div>
    </footer>
  );
}
