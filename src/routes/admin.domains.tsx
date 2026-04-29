import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle, Clock, XCircle, RefreshCw, Trash2, AlertCircle } from "lucide-react";
import { api, useMockApi } from "@/lib/api/client";
import type { AdminDomain } from "@/lib/api/types";

export const Route = createFileRoute("/admin/domains")({
  component: AdminDomainsPage,
});

const MOCK_DOMAINS: AdminDomain[] = [
  { storeId: "s1", storeName: "Atlas Watches",  storeSlug: "atlas-watches",  domain: "atlaswatches.ma",    verified: true,  verifiedAt: "2026-04-10", ownerEmail: "ahmed@demo.com" },
  { storeId: "s2", storeName: "Sara Cosmetics", storeSlug: "sara-cosmetics", domain: "saracosmetiques.com", verified: false, verifiedAt: null,         ownerEmail: "fatima@demo.com" },
];

function AdminDomainsPage() {
  const isMock  = useMockApi();
  const [items, setItems]   = useState<AdminDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    if (isMock) { setItems(MOCK_DOMAINS); setLoading(false); return; }
    api.adminDomains()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const verify = async (storeId: string) => {
    setActing(storeId);
    try { await api.adminVerifyDomain(storeId); load(); }
    finally { setActing(null); }
  };

  const revoke = async (storeId: string) => {
    if (!confirm("Révoquer ce domaine ?")) return;
    setActing(storeId);
    try { await api.adminRevokeDomain(storeId); load(); }
    finally { setActing(null); }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Domaines personnalisés</h2>
        <p className="text-xs text-white/40">{items.length} domaine{items.length > 1 ? "s" : ""} configuré{items.length > 1 ? "s" : ""}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total",     value: items.length,                                color: "text-white",  bg: "bg-white/5" },
          { label: "Vérifiés", value: items.filter(d => d.verified).length,         color: "text-green-400", bg: "bg-green-500/10" },
          { label: "En attente",value: items.filter(d => !d.verified).length,        color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-white/10 rounded-xl p-4 text-center`}>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-[11px] uppercase tracking-wider">
                <th className="text-start px-5 py-3">Domaine</th>
                <th className="text-start px-5 py-3">Boutique</th>
                <th className="text-start px-5 py-3">Propriétaire</th>
                <th className="text-start px-5 py-3">Statut</th>
                <th className="text-start px-5 py-3">Vérifié le</th>
                <th className="text-end px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-10 text-white/30">Chargement…</td></tr>}
              {!loading && items.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-white/30">Aucun domaine configuré</td></tr>
              )}
              {!loading && items.map(d => (
                <tr key={d.storeId} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-mono text-white text-sm">{d.domain}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-white/80 text-xs">{d.storeName}</p>
                    <p className="text-white/30 text-[10px]">/store/{d.storeSlug}</p>
                  </td>
                  <td className="px-5 py-3.5 text-white/50 text-xs">{d.ownerEmail}</td>
                  <td className="px-5 py-3.5">
                    {d.verified
                      ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="size-3.5" />Vérifié</span>
                      : <span className="flex items-center gap-1 text-amber-400 text-xs"><Clock className="size-3.5" />En attente</span>
                    }
                  </td>
                  <td className="px-5 py-3.5 text-white/40 text-xs">
                    {d.verifiedAt ? new Date(d.verifiedAt).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {!d.verified && (
                        <button
                          onClick={() => verify(d.storeId)}
                          disabled={acting === d.storeId || isMock}
                          title="Marquer comme vérifié"
                          className="p-1.5 rounded-lg text-green-400/60 hover:text-green-400 hover:bg-green-500/10 disabled:opacity-40 transition-colors"
                        >
                          {acting === d.storeId ? <RefreshCw className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                        </button>
                      )}
                      <button
                        onClick={() => revoke(d.storeId)}
                        disabled={acting === d.storeId || isMock}
                        title="Révoquer le domaine"
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
      </div>

      {isMock && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <AlertCircle className="size-3.5 shrink-0" />
          Mode démo — connectez le backend PHP pour gérer les vrais domaines.
        </div>
      )}
    </div>
  );
}
