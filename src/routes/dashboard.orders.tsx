import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";
import { StatusBadge } from "./dashboard.index";

export const Route = createFileRoute("/dashboard/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { t } = useTranslation();
  const { store } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store) return;
    setLoading(true);
    api.listOrders(store.id).then(setOrders).finally(() => setLoading(false));
  }, [store]);

  if (!store) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: store.currency }).format(n);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold">{t("orders.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("orders.subtitle")}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-start px-6 py-3 font-medium">{t("orders.id")}</th>
              <th className="text-start px-6 py-3 font-medium">{t("orders.customer")}</th>
              <th className="text-start px-6 py-3 font-medium">{t("orders.date")}</th>
              <th className="text-start px-6 py-3 font-medium">{t("orders.total")}</th>
              <th className="text-start px-6 py-3 font-medium">{t("orders.status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-surface-alt/50">
                <td className="px-6 py-4 font-medium">#{o.id}</td>
                <td className="px-6 py-4">{o.customerName}</td>
                <td className="px-6 py-4 text-muted-foreground num">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 num font-bold">{fmt(o.total)}</td>
                <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && orders.length === 0 && (
          <p className="text-sm text-muted-foreground py-12 text-center">{t("orders.empty")}</p>
        )}
      </div>
    </div>
  );
}
