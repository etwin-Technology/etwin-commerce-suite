import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, CheckCircle2, Truck, Eye, X, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api/client";
import type { Order, OrderStatus } from "@/lib/api/types";
import { DataToolbar } from "@/components/DataToolbar";
import { exportOrders } from "@/lib/excel";
import { useStoreFeatures } from "@/hooks/useStoreFeatures";
import { StatusBadge } from "./dashboard.index";

export const Route = createFileRoute("/dashboard/orders")({
  component: OrdersPage,
});

// Order status options. Labels go through i18n in the JSX (see t("orders.statusXxx")).
const STATUS_OPTIONS: { value: OrderStatus; tone: string }[] = [
  { value: "pending", tone: "amber" },
  { value: "paid",    tone: "emerald" },
  { value: "shipped", tone: "sky" },
];

function OrdersPage() {
  const { t } = useTranslation();
  const { store } = useAuth();
  const { features } = useStoreFeatures();
  const excelLocked = !!features && !features.excel_export;
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState<string>("");
  const [from, setFrom]         = useState("");
  const [to, setTo]             = useState("");
  const [editing, setEditing]   = useState<Order | null>(null);
  const [viewing, setViewing]   = useState<Order | null>(null);

  const refresh = () => {
    if (!store) return;
    setLoading(true);
    api.listOrders(store.id)
      .then(setOrders)
      .catch(e => toast.error(e instanceof Error ? e.message : "Échec du chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [store?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => !status || o.status === status)
      .filter((o) => {
        if (!q) return true;
        return (
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          (o.customerPhone || "").toLowerCase().includes(q) ||
          (o.city || "").toLowerCase().includes(q)
        );
      })
      .filter((o) => {
        if (!from && !to) return true;
        const d = new Date(o.createdAt).getTime();
        if (from && d < new Date(from).getTime()) return false;
        if (to && d > new Date(to).getTime() + 86400000) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, search, status, from, to]);

  if (!store) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: store.currency }).format(n);

  const setOrderStatus = async (o: Order, s: OrderStatus) => {
    try {
      await api.updateOrder(store.id, o.id, { status: s });
      toast.success("Statut mis à jour");
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
  };
  const remove = async (o: Order) => {
    if (!confirm(`Supprimer la commande #${o.id} ?`)) return;
    try {
      await api.deleteOrder(store.id, o.id);
      toast.success("Commande supprimée");
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
  };
  const saveEdit = async (patch: Partial<Order>) => {
    if (!editing) return;
    try {
      await api.updateOrder(store.id, editing.id, patch);
      toast.success("Commande mise à jour");
      setEditing(null);
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold">{t("orders.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("orders.subtitle")}</p>
        </div>
        <button
          onClick={() => {
            if (excelLocked) { toast.error("Export Excel verrouillé pour votre plan."); return; }
            exportOrders(filtered, store.slug);
          }}
          disabled={filtered.length === 0 || excelLocked}
          title={excelLocked ? "Export Excel verrouillé pour votre plan" : "Exporter en .xlsx"}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <FileSpreadsheet className="size-4 text-emerald-600" />
          Exporter Excel ({filtered.length})
        </button>
      </div>

      <DataToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par n°, nom, téléphone, ville…"
        chips={[
          {
            label: "Statut",
            value: status,
            onChange: setStatus,
            options: STATUS_OPTIONS.map((s) => ({ value: s.value, label: t(`orders.${s.value}`) })),
          },
        ]}
        dateRange={{ from, to, onChange: (f, tt) => { setFrom(f); setTo(tt); } }}
        count={{ filtered: filtered.length, total: orders.length }}
      />

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-start px-4 py-3 font-medium">N°</th>
              <th className="text-start px-4 py-3 font-medium">Client</th>
              <th className="text-start px-4 py-3 font-medium">Ville</th>
              <th className="text-start px-4 py-3 font-medium">Date</th>
              <th className="text-start px-4 py-3 font-medium">Total</th>
              <th className="text-start px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-surface-alt/50">
                <td className="px-4 py-3 font-mono text-xs">#{o.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{o.customerName}</div>
                  {o.customerPhone && (
                    <div className="text-[11px] text-muted-foreground num">{o.customerPhone}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{o.city || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground num text-xs">
                  {new Date(o.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3 num font-bold">{fmt(o.total)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-end">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => setViewing(o)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title="Voir">
                      <Eye className="size-3.5" />
                    </button>
                    {o.status === "pending" && (
                      <button
                        onClick={() => setOrderStatus(o, "paid")}
                        className="p-1.5 rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600"
                        title="Confirmer"
                      >
                        <CheckCircle2 className="size-3.5" />
                      </button>
                    )}
                    {o.status === "paid" && (
                      <button
                        onClick={() => setOrderStatus(o, "shipped")}
                        className="p-1.5 rounded-md hover:bg-sky-500/10 text-muted-foreground hover:text-sky-600"
                        title="Expédier"
                      >
                        <Truck className="size-3.5" />
                      </button>
                    )}
                    <button onClick={() => setEditing(o)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title="Modifier">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => remove(o)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Supprimer">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {orders.length === 0 ? t("orders.empty") : "Aucun résultat avec ces filtres."}
          </p>
        )}
      </div>

      {/* Edit modal */}
      {editing && <EditOrderModal order={editing} onClose={() => setEditing(null)} onSave={saveEdit} />}

      {/* View modal */}
      {viewing && <OrderDetailsModal order={viewing} fmt={fmt} onClose={() => setViewing(null)} />}
    </div>
  );
}

function EditOrderModal({
  order, onClose, onSave,
}: { order: Order; onClose: () => void; onSave: (patch: Partial<Order>) => void }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState({
    customerName:    order.customerName,
    customerPhone:   order.customerPhone || "",
    customerAddress: order.customerAddress || "",
    city:            order.city || "",
    status:          order.status,
    notes:           order.notes || "",
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Modifier la commande #{order.id}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Nom du client" value={draft.customerName} onChange={(v) => setDraft({ ...draft, customerName: v })} />
          <Field label="Téléphone" value={draft.customerPhone} onChange={(v) => setDraft({ ...draft, customerPhone: v })} />
          <Field label="Adresse" value={draft.customerAddress} onChange={(v) => setDraft({ ...draft, customerAddress: v })} />
          <Field label="Ville" value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} />
          <label className="block">
            <span className="text-xs font-medium mb-1.5 block">Statut</span>
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as OrderStatus })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{t(`orders.${s.value}`)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium mb-1.5 block">Notes</span>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-full border border-border hover:bg-surface-alt">Annuler</button>
          <button onClick={() => onSave(draft)} className="px-4 py-2 text-sm rounded-full bg-primary text-primary-foreground hover:bg-primary/90">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailsModal({
  order, fmt, onClose,
}: { order: Order; fmt: (n: number) => string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Commande #{order.id}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="space-y-2 text-sm">
          <Row k="Client" v={order.customerName} />
          {order.customerPhone && <Row k="Téléphone" v={order.customerPhone} />}
          {order.customerAddress && <Row k="Adresse" v={order.customerAddress} />}
          {order.city && <Row k="Ville" v={order.city} />}
          <Row k="Statut" v={<StatusBadge status={order.status} />} />
          <Row k="Date" v={new Date(order.createdAt).toLocaleString("fr-FR")} />
          {order.notes && <Row k="Notes" v={order.notes} />}
        </div>
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Articles</p>
          <ul className="space-y-1.5">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span>{it.name} <span className="text-muted-foreground">× {it.qty}</span></span>
                <span className="num font-medium">{fmt(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between font-bold">
            <span>Total</span>
            <span className="num">{fmt(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground text-xs">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium mb-1.5 block">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
