import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api/client";
import type { DashboardStats, Order } from "@/lib/api/types";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const { t } = useTranslation();
  const { store, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store) return;
    let active = true;
    setLoading(true);
    Promise.all([api.dashboardStats(store.id), api.listOrders(store.id)])
      .then(([s, o]) => {
        if (!active) return;
        setStats(s);
        setOrders(o.slice(0, 5));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [store]);

  if (!store) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: store.currency }).format(n);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("dashboard.overview")}</p>
        <h1 className="font-serif text-4xl font-bold mt-2">{t("dashboard.welcome", { name: user?.fullName.split(" ")[0] })}</h1>
        <p className="text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label={t("dashboard.kpiRevenue")} value={stats ? fmt(stats.revenue) : "—"} delta={stats?.revenueDelta ?? 0} loading={loading} />
        <Kpi label={t("dashboard.kpiOrders")} value={stats ? stats.ordersCount.toString() : "—"} delta={stats?.ordersDelta ?? 0} loading={loading} />
        <Kpi label={t("dashboard.kpiCustomers")} value={stats ? stats.customersCount.toString() : "—"} delta={stats?.customersDelta ?? 0} loading={loading} />
        <Kpi label={t("dashboard.kpiConversion")} value={stats ? `${stats.conversion.toFixed(2)}%` : "—"} delta={stats?.conversionDelta ?? 0} loading={loading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-lg font-bold">{t("dashboard.salesTrend")}</h2>
          <p className="text-xs text-muted-foreground">7 derniers jours</p>
          <div className="mt-6 h-56 flex items-end gap-3">
            {(stats?.salesByDay ?? Array.from({ length: 7 }).map((_, i) => ({ day: ["L", "M", "M", "J", "V", "S", "D"][i], value: 0 }))).map((d, i) => {
              const max = Math.max(...(stats?.salesByDay ?? [{ value: 1 }]).map((x) => x.value), 1);
              const h = (d.value / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-primary/15 to-primary/55 transition-all"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-lg font-bold">{t("dashboard.recentOrders")}</h2>
          <ul className="mt-4 divide-y divide-border">
            {orders.map((o) => (
              <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{o.customerName}</p>
                  <p className="text-[11px] text-muted-foreground">#{o.id}</p>
                </div>
                <div className="text-end">
                  <p className="text-sm font-bold num">{fmt(o.total)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </li>
            ))}
            {!loading && orders.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">{t("orders.empty")}</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, delta, loading }: { label: string; value: string; delta: number; loading: boolean }) {
  const positive = delta >= 0;
  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold num">{loading ? "—" : value}</p>
      <p className={`mt-1 inline-flex items-center gap-1 text-xs ${positive ? "text-success" : "text-destructive"}`}>
        {positive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
        <span className="num">{Math.abs(delta).toFixed(1)}%</span>
      </p>
    </div>
  );
}

export function StatusBadge({ status }: { status: "pending" | "paid" | "shipped" }) {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning-foreground border-warning/30",
    paid: "bg-success/15 text-success border-success/30",
    shipped: "bg-primary/10 text-primary border-primary/20",
  };
  return (
    <span className={`inline-block mt-0.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[status]}`}>
      {t(`orders.${status}`)}
    </span>
  );
}
