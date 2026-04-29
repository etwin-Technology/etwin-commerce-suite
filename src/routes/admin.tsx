import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { BarChart3, Users, Store, Globe, LogOut, Shield, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const adminNav = [
  { to: "/admin",         icon: LayoutDashboard, label: "Tableau de bord", exact: true },
  { to: "/admin/users",   icon: Users,           label: "Utilisateurs" },
  { to: "/admin/stores",  icon: Store,           label: "Boutiques" },
  { to: "/admin/domains", icon: Globe,           label: "Domaines" },
];

function AdminLayout() {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();

  useEffect(() => {
    if (user && !user.isAdmin) void navigate({ to: "/dashboard" });
  }, [user]);

  if (!user?.isAdmin) return null;

  return (
    <div className="min-h-dvh grid grid-cols-[240px_1fr] bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="flex flex-col border-e border-white/10">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Shield className="size-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Super Admin</p>
              <p className="text-[10px] text-white/40">ETWIN Commerce</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminNav.map(({ to, icon: Icon, label, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to) && to !== "/admin";
            const isAdminRoot = to === "/admin" && location.pathname === "/admin";
            const isActive = isAdminRoot || (!exact && location.pathname.startsWith(to) && to !== "/admin");
            const finalActive = to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  finalActive
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-white/60 hover:text-white hover:bg-white/7"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/7 transition-colors"
          >
            <BarChart3 className="size-3.5" />
            Mon tableau de bord
          </Link>
          <button
            onClick={() => { logout(); void navigate({ to: "/" }); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-colors mt-1"
          >
            <LogOut className="size-3.5" />
            Se déconnecter
          </button>
          <div className="px-3 pt-3 border-t border-white/10 mt-2">
            <p className="text-xs font-semibold truncate">{user.fullName}</p>
            <p className="text-[10px] text-white/40 truncate">{user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col min-w-0">
        <header className="h-14 border-b border-white/10 bg-gray-900 flex items-center px-6">
          <h1 className="text-sm font-semibold text-white/80">Administration ETWIN</h1>
          <span className="ms-3 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">SUPER ADMIN</span>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
