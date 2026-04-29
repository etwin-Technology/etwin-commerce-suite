import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Store, CreditCard, ShoppingCart, TrendingUp, DollarSign, UserCheck, Clock } from "lucide-react";
import { api, useMockApi } from "@/lib/api/client";
import type { AdminStats } from "@/lib/api/types";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const MOCK_STATS: AdminStats = {
  totalUsers: 142,   totalStores: 138,  activeSubs: 91,
  proSubs: 34,       trialSubs: 57,     expiredSubs: 51,
  totalOrders: 2847, totalRevenue: 284700, monthlyMrr: 3366,
  newUsers7d: 18,
  userGrowth: [
    { day: "2026-04-22", value: 3 }, { day: "2026-04-23", value: 1 },
    { day: "2026-04-24", value: 5 }, { day: "2026-04-25", value: 2 },
    { day: "2026-04-26", value: 4 }, { day: "2026-04-27", value: 2 }, { day: "2026-04-28", value: 1 },
  ],
};

function StatCard({ icon: Icon, label, value, sub, color = "violet" }: {
  icon: React.ComponentType<{className?: string}>;
  label: string;
  value: string | number;
  sub?: string;
  color?: "violet" | "green" | "amber" | "blue" | "red";
}) {
  const colorMap: Record<string, string> = {
    violet: "text-violet-400 bg-violet-500/10",
    green:  "text-green-400 bg-green-500/10",
    amber:  "text-amber-400 bg-amber-500/10",
    blue:   "text-blue-400 bg-blue-500/10",
    red:    "text-red-400 bg-red-500/10",
  };
  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`size-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="size-5" />
        </div>
      </div>
      <p className="text-2xl font-black text-white">{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
      <p className="text-xs text-white/50 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

function AdminDashboard() {
  const isMock = useMockApi();
  const [stats, setStats]   = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMock) {
      setStats(MOCK_STATS);
      setLoading(false);
      return;
    }
    api.adminStats()
      .then(setStats)
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-40 text-white/40 text-sm">Chargement…</div>;
  if (!stats)  return null;

  const maxGrowth = Math.max(...stats.userGrowth.map(d => d.value), 1);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Statistiques globales</h2>
        <p className="text-xs text-white/40 mt-0.5">Vue d'ensemble de la plateforme ETWIN Commerce</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}      label="Utilisateurs totaux" value={stats.totalUsers}   sub={`+${stats.newUsers7d} cette semaine`} color="blue" />
        <StatCard icon={Store}      label="Boutiques actives"  value={stats.activeSubs}   sub={`${stats.totalStores} total`} color="violet" />
        <StatCard icon={CreditCard} label="Abonnements Pro"    value={stats.proSubs}      sub={`${stats.trialSubs} en essai`} color="green" />
        <StatCard icon={DollarSign} label="MRR (MAD)"         value={`${stats.monthlyMrr.toLocaleString("fr-FR")} MAD`} sub="revenus mensuels récurrents" color="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <StatCard icon={ShoppingCart} label="Commandes totales"  value={stats.totalOrders}   color="blue" />
        <StatCard icon={TrendingUp}   label="Revenu total (MAD)" value={`${stats.totalRevenue.toLocaleString("fr-FR")} MAD`} color="green" />
      </div>

      {/* Subscription breakdown */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Répartition des abonnements</h3>
          <div className="space-y-3">
            {[
              { label: "Pro actifs",     value: stats.proSubs,    total: stats.totalStores, color: "bg-violet-500" },
              { label: "Essai actifs",   value: stats.trialSubs,  total: stats.totalStores, color: "bg-amber-500"  },
              { label: "Expirés",        value: stats.expiredSubs,total: stats.totalStores, color: "bg-red-500"    },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{r.label}</span>
                  <span className="text-white font-semibold">{r.value}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${r.color} rounded-full transition-all`}
                    style={{ width: `${(r.value / Math.max(r.total, 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User growth chart */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Inscriptions (7 derniers jours)</h3>
          <div className="flex items-end gap-1.5 h-24">
            {stats.userGrowth.slice(-7).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-md"
                  style={{ height: `${(d.value / maxGrowth) * 80}px`, minHeight: "4px" }}
                />
                <span className="text-[9px] text-white/30">
                  {new Date(d.day).toLocaleDateString("fr-FR", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Actions rapides</h3>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/users"   className="px-4 py-2 bg-white/7 hover:bg-white/15 text-white rounded-xl text-xs font-medium transition-colors">
            Gérer les utilisateurs →
          </a>
          <a href="/admin/stores"  className="px-4 py-2 bg-white/7 hover:bg-white/15 text-white rounded-xl text-xs font-medium transition-colors">
            Gérer les boutiques →
          </a>
          <a href="/admin/domains" className="px-4 py-2 bg-white/7 hover:bg-white/15 text-white rounded-xl text-xs font-medium transition-colors">
            Vérifier les domaines →
          </a>
        </div>
      </div>
    </div>
  );
}
