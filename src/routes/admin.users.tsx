import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search, ShieldOff, Trash2, ChevronLeft, ChevronRight,
  Crown, Clock, AlertCircle, Shield, UserCog, Check, KeyRound,
} from "lucide-react";
import { api } from "@/lib/api/client";
import type { AdminUser, PaginatedResponse, UserRole } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

const ROLE_LABELS: Record<UserRole, string> = {
  user:        "Utilisateur",
  admin:       "Admin",
  super_admin: "Super Admin",
};

const ROLE_COLORS: Record<UserRole, string> = {
  user:        "bg-white/10 text-white/60",
  admin:       "bg-blue-500/20 text-blue-300",
  super_admin: "bg-amber-500/20 text-amber-300",
};

function PlanBadge({ plan, active }: { plan: string; active: boolean }) {
  if (!active) return (
    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400">Expiré</span>
  );
  if (plan === "pro") return (
    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-500/20 text-violet-300 flex items-center gap-1 w-fit">
      <Crown className="size-2.5" />Pro
    </span>
  );
  return (
    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 flex items-center gap-1 w-fit">
      <Clock className="size-2.5" />Essai
    </span>
  );
}

function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [data, setData]       = useState<PaginatedResponse<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage]       = useState(1);
  const [acting, setActing]   = useState<string | null>(null);
  const [roleEditing, setRoleEditing] = useState<string | null>(null);
  const [roleSaved, setRoleSaved]     = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    api.adminUsers({ page, q: q || undefined, role: roleFilter || undefined })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(reload, [page, q, roleFilter]);

  const suspend = async (id: string) => {
    if (!confirm("Suspendre / réactiver cet utilisateur ?")) return;
    setActing(id);
    try { await api.adminSuspendUser(id); reload(); }
    finally { setActing(null); }
  };

  const del = async (id: string) => {
    if (!confirm("SUPPRIMER définitivement cet utilisateur ? Cette action est irréversible.")) return;
    setActing(id);
    try { await api.adminDeleteUser(id); reload(); }
    finally { setActing(null); }
  };

  const changeRole = async (userId: string, newRole: UserRole) => {
    setRoleEditing(userId);
    try {
      await api.adminUpdateUserRole(userId, newRole);
      setData(prev => prev ? {
        ...prev,
        items: prev.items.map(u => u.id === userId ? { ...u, role: newRole, isAdmin: newRole !== "user" } : u),
      } : prev);
      setRoleSaved(userId);
      setTimeout(() => setRoleSaved(null), 2000);
    } finally { setRoleEditing(null); }
  };

  const items = data?.items ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Utilisateurs</h2>
          <p className="text-xs text-white/40">{data?.total ?? 0} utilisateur{(data?.total ?? 0) > 1 ? "s" : ""} enregistré{(data?.total ?? 0) > 1 ? "s" : ""}</p>
        </div>

        {/* Demo accounts info */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-white/30 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Shield className="size-3 text-amber-400" />
          <span>Démo : <code className="text-white/50">demo1234</code> pour tous les comptes</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Email ou nom…"
            className="w-full ps-9 pe-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-white/10 rounded-xl text-sm text-white/70 px-3 py-2.5 focus:outline-none focus:border-white/30"
        >
          <option value="">Tous les rôles</option>
          <option value="user">Utilisateur</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-[11px] uppercase tracking-wider">
                <th className="text-start px-5 py-3">Utilisateur</th>
                <th className="text-start px-5 py-3">Rôle</th>
                <th className="text-start px-5 py-3">Boutique</th>
                <th className="text-start px-5 py-3">Plan</th>
                <th className="text-start px-5 py-3 hidden lg:table-cell">Commandes</th>
                <th className="text-end px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center py-10 text-white/30 animate-pulse">Chargement…</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-white/30">Aucun utilisateur trouvé</td></tr>
              )}
              {!loading && items.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  {/* User info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{u.fullName}</p>
                        <p className="text-[11px] text-white/40">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role — editable for super_admin */}
                  <td className="px-5 py-3.5">
                    {isSuperAdmin && u.id !== currentUser?.id ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={u.role}
                          disabled={roleEditing === u.id}
                          onChange={e => changeRole(u.id, e.target.value as UserRole)}
                          className="bg-transparent border-none text-xs focus:outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="user"        className="bg-gray-800">Utilisateur</option>
                          <option value="admin"       className="bg-gray-800">Admin</option>
                          <option value="super_admin" className="bg-gray-800">Super Admin</option>
                        </select>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                        {roleSaved === u.id && <Check className="size-3 text-green-400" />}
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    )}
                  </td>

                  {/* Store */}
                  <td className="px-5 py-3.5">
                    {u.store ? (
                      <div>
                        <p className="text-white text-xs font-medium">{u.store.name}</p>
                        <p className="text-white/30 text-[10px]">/{u.store.slug}</p>
                        {u.store.customDomain && (
                          <p className="text-violet-400 text-[10px]">{u.store.customDomain}</p>
                        )}
                      </div>
                    ) : <span className="text-white/20 text-xs">—</span>}
                  </td>

                  {/* Plan */}
                  <td className="px-5 py-3.5">
                    {u.store ? <PlanBadge plan={u.store.plan} active={u.store.active} /> : "—"}
                  </td>

                  {/* Orders */}
                  <td className="px-5 py-3.5 text-white/60 text-xs hidden lg:table-cell">
                    {u.store?.orderCount ?? 0}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {isSuperAdmin && u.store && (
                        <Link
                          to="/admin/access"
                          title="Gérer les accès & features"
                          className="p-1.5 rounded-lg text-amber-300/60 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                        >
                          <KeyRound className="size-3.5" />
                        </Link>
                      )}
                      <button
                        onClick={() => suspend(u.id)}
                        disabled={!!acting || u.id === currentUser?.id}
                        title="Suspendre / Réactiver la boutique"
                        className="p-1.5 rounded-lg text-amber-400/50 hover:text-amber-400 hover:bg-amber-500/10 disabled:opacity-30 transition-colors"
                      >
                        <ShieldOff className="size-3.5" />
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => del(u.id)}
                          disabled={!!acting || u.id === currentUser?.id}
                          title="Supprimer définitivement"
                          className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.pages ?? 0) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
            <span className="text-xs text-white/40">Page {data?.page} / {data?.pages}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/7 disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(data?.pages ?? 1, p + 1))}
                disabled={page >= (data?.pages ?? 1)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/7 disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Demo accounts cheat sheet */}
      <div className="mt-4 bg-gray-900 border border-white/10 rounded-2xl p-4">
        <p className="text-xs font-semibold text-white/50 mb-3 flex items-center gap-2">
          <UserCog className="size-3.5 text-amber-400" />
          Comptes de démonstration — mot de passe : <code className="text-amber-300">demo1234</code>
        </p>
        <div className="grid sm:grid-cols-3 gap-2 text-xs">
          {[
            { email: "demo@etwin.app",       role: "user",        label: "Marchand",   desc: "Atlas Watches · Essai",    color: "text-white/60 bg-white/5" },
            { email: "admin@etwin.app",      role: "admin",       label: "Admin",      desc: "Sahara Boutique · Pro",    color: "text-blue-300 bg-blue-500/10" },
            { email: "superadmin@etwin.app", role: "super_admin", label: "Super Admin",desc: "Accès plateforme complet", color: "text-amber-300 bg-amber-500/10" },
          ].map(a => (
            <div key={a.email} className={`rounded-xl p-3 border border-white/5 ${a.color}`}>
              <p className="font-bold text-[11px] uppercase tracking-wide">{a.label}</p>
              <p className="text-[11px] mt-0.5 opacity-80">{a.email}</p>
              <p className="text-[10px] mt-1 opacity-60">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
        <AlertCircle className="size-3.5 shrink-0" />
        Mode démo actif — Les modifications de rôle sont temporaires en mode mock.
      </div>
    </div>
  );
}
