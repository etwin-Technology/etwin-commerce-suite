import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart3, Users, Store, Globe, LogOut, Shield, LayoutDashboard,
  Settings, Sliders,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const adminNav = [
  { to: "/admin",          icon: LayoutDashboard, label: "Tableau de bord", superAdminOnly: false },
  { to: "/admin/users",    icon: Users,           label: "Utilisateurs",    superAdminOnly: false },
  { to: "/admin/stores",   icon: Store,           label: "Boutiques",       superAdminOnly: false },
  { to: "/admin/domains",  icon: Globe,           label: "Domaines",        superAdminOnly: false },
  { to: "/admin/settings", icon: Settings,        label: "Paramètres",      superAdminOnly: true  },
  { to: "/admin/plans",    icon: Sliders,         label: "Plans & Accès",   superAdminOnly: true  },
];

function AdminLayout() {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "super_admin") {
      void navigate({ to: "/dashboard" });
    }
  }, [user]);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return null;

  const isSuperAdmin = user.role === "super_admin";

  return (
    <div className="min-h-dvh flex bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col border-e border-white/10">
        {/* Branding */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Shield className="size-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </p>
              <p className="text-[10px] text-white/40">ETWIN Commerce</p>
            </div>
          </div>
          {/* Role badge */}
          <div className="mt-3">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              isSuperAdmin
                ? "bg-amber-500/20 text-amber-300"
                : "bg-blue-500/20 text-blue-300"
            }`}>
              {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {adminNav
            .filter(item => !item.superAdminOnly || isSuperAdmin)
            .map(({ to, icon: Icon, label }) => {
              const active = to === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-amber-500/20 text-amber-300"
                      : "text-white/60 hover:text-white hover:bg-white/7"
                  }`}
                >
                  <span className={`size-7 rounded-lg flex items-center justify-center ${
                    active ? "bg-amber-500/20" : "bg-white/5"
                  }`}>
                    <Icon className="size-4" />
                  </span>
                  {label}
                </Link>
              );
            })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 pt-3 border-t border-white/10 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/7 transition-colors"
          >
            <BarChart3 className="size-3.5" />
            Mon tableau de bord
          </Link>
          <button
            onClick={() => { logout(); void navigate({ to: "/" }); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="size-3.5" />
            Se déconnecter
          </button>
          <div className="px-3 pt-2 border-t border-white/10 mt-1">
            <p className="text-xs font-semibold truncate">{user.fullName}</p>
            <p className="text-[10px] text-white/40 truncate">{user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-white/10 bg-gray-900 flex items-center px-6 gap-3 shrink-0">
          <h1 className="text-sm font-semibold text-white/80">Administration ETWIN Commerce</h1>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            isSuperAdmin ? "bg-amber-500/20 text-amber-300" : "bg-blue-500/20 text-blue-300"
          }`}>
            {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
          </span>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
