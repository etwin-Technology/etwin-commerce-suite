import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Store as StoreIcon, ExternalLink, LayoutTemplate } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navItems = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard, label: "nav.dashboard" },
  { to: "/dashboard/products", key: "products", icon: Package, label: "nav.products" },
  { to: "/dashboard/orders", key: "orders", icon: ShoppingCart, label: "nav.orders" },
  { to: "/dashboard/customers", key: "customers", icon: Users, label: "nav.customers" },
  { to: "/dashboard/landing", key: "landing", icon: LayoutTemplate, label: "nav.landing" },
  { to: "/dashboard/settings", key: "settings", icon: Settings, label: "nav.settings" },
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { store, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate({ to: "/" });
  };

  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-[260px_1fr] bg-surface">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col border-e border-border bg-sidebar">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold text-primary tracking-tight">ETWIN</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Commerce</span>
          </Link>
          {store && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
              <StoreIcon className="size-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{store.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">/store/{store.slug}</p>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, key, icon: Icon }) => {
            const active = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className="size-4" />
                <span>{t(`nav.${key}`)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
          {store && (
            <a
              href={`/store/${store.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
            >
              <ExternalLink className="size-3.5" />
              {t("nav.viewStore")}
            </a>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
          >
            <LogOut className="size-3.5" />
            {t("nav.logout")}
          </button>
          {user && (
            <div className="px-3 pt-3 border-t border-sidebar-border">
              <p className="text-xs font-medium truncate">{user.fullName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="md:hidden">
            <Link to="/dashboard" className="font-serif font-bold text-primary">ETWIN</Link>
          </div>
          <div className="ms-auto flex items-center gap-3">
            {store && <PlanBadge plan={store.subscription.plan} expiresAt={store.subscription.expiresAt} />}
            <LanguageSwitcher />
          </div>
        </header>
        <main className="flex-1 px-6 md:px-10 py-8">{children}</main>
      </div>
    </div>
  );
}

function PlanBadge({ plan, expiresAt }: { plan: string; expiresAt: string }) {
  const { t } = useTranslation();
  const days = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
  const expired = days <= 0;
  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs">
      <span
        className={`size-1.5 rounded-full ${expired ? "bg-destructive" : "bg-success"}`}
        aria-hidden
      />
      <span className="font-medium capitalize">{t(`plans.${plan}`)}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">
        {expired ? t("plans.expired") : t("plans.expiresIn", { days })}
      </span>
    </div>
  );
}
