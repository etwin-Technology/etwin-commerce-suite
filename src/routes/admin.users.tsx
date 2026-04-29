import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ShieldOff, Trash2, ChevronLeft, ChevronRight, Crown, Clock, AlertCircle } from "lucide-react";
import { api, useMockApi } from "@/lib/api/client";
import type { AdminUser, PaginatedResponse } from "@/lib/api/types";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

const MOCK: PaginatedResponse<AdminUser> = {
  total: 3, page: 1, pages: 1,
  items: [
    { id: "1", email: "ahmed@demo.com",   fullName: "Ahmed Benali",  isAdmin: false, createdAt: "2026-04-01", store: { id: "s1", name: "Atlas Watches", slug: "atlas-watches", plan: "pro",   expiresAt: "2026-05-01", active: true,  customDomain: "atlaswatches.ma", orderCount: 42 } },
    { id: "2", email: "fatima@demo.com",  fullName: "Fatima Zohra",  isAdmin: false, createdAt: "2026-04-05", store: { id: "s2", name: "Sara Cosmétics", slug: "sara-cosmetics", plan: "trial", expiresAt: "2026-04-19", active: true,  customDomain: null, orderCount: 5  } },
    { id: "3", email: "karim@demo.com",   fullName: "Karim Tazi",    isAdmin: true,  createdAt: "2026-03-15", store: { id: "s3", name: "Karim Store",   slug: "karim-store",   plan: "trial", expiresAt: "2026-03-29", active: false, customDomain: null, orderCount: 0  } },
  ],
};

function PlanBadge({ plan, active }: { plan: string; active: boolean }) {
  if (!active) return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400">Expiré</span>;
  if (plan === "pro") return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-500/20 text-violet-300 flex items-center gap-1 w-fit"><Crown className="size-2.5" />Pro</span>;
  return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 flex items-center gap-1 w-fit"><Clock className="size-2.5" />Essai</span>;
}

function AdminUsersPage() {
  const isMock = useMockApi();
  const [data, setData]       = useState<PaginatedResponse<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState("");
  const [page, setPage]       = useState(1);
  const [acting, setActing]   = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    if (isMock) { setData(MOCK); setLoading(false); return; }
    api.adminUsers({ page, q: q || undefined })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, q]);

  const suspend = async (id: string) => {
    if (!confirm("Suspendre / réactiver cet utilisateur ?")) return;
    setActing(id);
    try {
      await api.adminSuspendUser(id);
      load();
    } finally { setActing(null); }
  };

  const del = async (id: string) => {
    if (!confirm("SUPPRIMER définitivement cet utilisateur ? Cette action est irréversible.")) return;
    setActing(id);
    try {
      await api.adminDeleteUser(id);
      load();
    } finally { setActing(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Utilisateurs</h2>
          <p className="text-xs text-white/40">{data?.total ?? 0} utilisateurs enregistrés</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Rechercher par email ou nom…"
          className="w-full ps-9 pe-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-[11px] uppercase tracking-wider">
                <th className="text-start px-5 py-3">Utilisateur</th>
                <th className="text-start px-5 py-3">Boutique</th>
                <th className="text-start px-5 py-3">Plan</th>
                <th className="text-start px-5 py-3">Commandes</th>
                <th className="text-start px-5 py-3">Inscrit le</th>
                <th className="text-end px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center py-10 text-white/30">Chargement…</td></tr>
              )}
              {!loading && (data?.items ?? []).length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-white/30">Aucun utilisateur trouvé</td></tr>
              )}
              {!loading && (data?.items ?? []).map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-white">{u.fullName}</p>
                    <p className="text-xs text-white/40">{u.email}</p>
                    {u.isAdmin && <span className="text-[10px] text-amber-400 font-bold">ADMIN</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {u.store ? (
                      <div>
                        <p className="text-white text-xs font-medium">{u.store.name}</p>
                        <p className="text-white/30 text-[10px]">/store/{u.store.slug}</p>
                        {u.store.customDomain && <p className="text-violet-400 text-[10px]">{u.store.customDomain}</p>}
                      </div>
                    ) : <span className="text-white/20 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {u.store ? <PlanBadge plan={u.store.plan} active={u.store.active} /> : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-white/60 text-xs">
                    {u.store?.orderCount ?? 0}
                  </td>
                  <td className="px-5 py-3.5 text-white/40 text-xs">
                    {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => suspend(u.id)}
                        disabled={acting === u.id || isMock}
                        title="Suspendre / Réactiver"
                        className="p-1.5 rounded-lg text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10 disabled:opacity-40 transition-colors"
                      >
                        <ShieldOff className="size-3.5" />
                      </button>
                      <button
                        onClick={() => del(u.id)}
                        disabled={acting === u.id || isMock}
                        title="Supprimer"
                        className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
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
                disabled={page === 1}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/7 disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(data?.pages ?? 1, p + 1))}
                disabled={page === data?.pages}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/7 disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isMock && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <AlertCircle className="size-3.5 shrink-0" />
          Mode démo — connectez le backend PHP pour gérer de vrais utilisateurs.
        </div>
      )}
    </div>
  );
}
