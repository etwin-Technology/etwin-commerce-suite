import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api/client";
import type { Customer } from "@/lib/api/types";

export const Route = createFileRoute("/dashboard/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const { t } = useTranslation();
  const { store } = useAuth();
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store) return;
    setLoading(true);
    api.listCustomers(store.id).then(setItems).finally(() => setLoading(false));
  }, [store]);

  if (!store) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: store.currency }).format(n);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold">{t("customers.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("customers.subtitle")}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-start px-6 py-3 font-medium">{t("customers.name")}</th>
              <th className="text-start px-6 py-3 font-medium">{t("customers.phone")}</th>
              <th className="text-start px-6 py-3 font-medium">{t("customers.address")}</th>
              <th className="text-start px-6 py-3 font-medium">{t("customers.ordersCount")}</th>
              <th className="text-start px-6 py-3 font-medium">{t("customers.totalSpent")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-surface-alt/50">
                <td className="px-6 py-4 font-medium">{c.name}</td>
                <td className="px-6 py-4 text-muted-foreground num">{c.phone}</td>
                <td className="px-6 py-4 text-muted-foreground">{c.address}</td>
                <td className="px-6 py-4 num">{c.ordersCount}</td>
                <td className="px-6 py-4 num font-bold">{fmt(c.totalSpent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground py-12 text-center">{t("customers.empty")}</p>
        )}
      </div>
    </div>
  );
}
