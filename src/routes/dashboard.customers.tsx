import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Phone, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api/client";
import type { Customer } from "@/lib/api/types";
import { DataToolbar } from "@/components/DataToolbar";
import { exportCustomers } from "@/lib/excel";

export const Route = createFileRoute("/dashboard/customers")({
  component: CustomersPage,
});

type Draft = { name: string; phone: string; address: string };
const blank = (): Draft => ({ name: "", phone: "", address: "" });

function CustomersPage() {
  const { t } = useTranslation();
  const { store } = useAuth();
  const [items, setItems]       = useState<Customer[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [sort, setSort]         = useState<"spent" | "orders" | "name">("spent");
  const [editing, setEditing]   = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft]       = useState<Draft>(blank());

  const refresh = () => {
    if (!store) return;
    setLoading(true);
    api.listCustomers(store.id).then(setItems).finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [store?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((c) => {
        if (!q) return true;
        return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sort === "spent")  return b.totalSpent - a.totalSpent;
        if (sort === "orders") return b.ordersCount - a.ordersCount;
        return a.name.localeCompare(b.name);
      });
  }, [items, search, sort]);

  if (!store) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: store.currency }).format(n);

  const startCreate = () => { setEditing(null); setDraft(blank()); setCreating(true); };
  const startEdit   = (c: Customer) => { setCreating(false); setEditing(c); setDraft({ name: c.name, phone: c.phone, address: c.address }); };
  const cancel      = () => { setCreating(false); setEditing(null); };
  const save        = async () => {
    if (!draft.name.trim() || !draft.phone.trim()) return;
    if (editing) await api.updateCustomer(store.id, editing.id, draft);
    else         await api.createCustomer(store.id, draft);
    cancel();
    refresh();
  };
  const remove = async (c: Customer) => {
    if (!confirm(`Supprimer ${c.name} ?`)) return;
    await api.deleteCustomer(store.id, c.id);
    refresh();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-4xl font-bold">{t("customers.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("customers.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCustomers(filtered, store.slug)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <FileSpreadsheet className="size-4 text-emerald-600" />
            Excel
          </button>
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Nouveau client
          </button>
        </div>
      </div>

      <DataToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par nom, téléphone, adresse…"
        chips={[
          {
            label: "Trier",
            value: sort,
            onChange: (v) => setSort((v || "spent") as "spent" | "orders" | "name"),
            options: [
              { value: "spent",  label: "Plus dépensé" },
              { value: "orders", label: "Plus commandes" },
              { value: "name",   label: "Nom A-Z" },
            ],
          },
        ]}
        count={{ filtered: filtered.length, total: items.length }}
      />

      {(creating || editing) && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? "Modifier le client" : "Nouveau client"}</h3>
            <button onClick={cancel} className="p-1.5 rounded-md hover:bg-muted"><X className="size-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nom complet" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <Field label="Téléphone" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
            <div className="sm:col-span-2">
              <Field label="Adresse" value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button onClick={cancel} className="px-4 py-2 text-sm rounded-full border border-border hover:bg-surface-alt">Annuler</button>
            <button onClick={save} className="px-4 py-2 text-sm rounded-full bg-primary text-primary-foreground hover:bg-primary/90">Enregistrer</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-start px-4 py-3 font-medium">{t("customers.name")}</th>
              <th className="text-start px-4 py-3 font-medium">{t("customers.phone")}</th>
              <th className="text-start px-4 py-3 font-medium">{t("customers.address")}</th>
              <th className="text-start px-4 py-3 font-medium">{t("customers.ordersCount")}</th>
              <th className="text-start px-4 py-3 font-medium">{t("customers.totalSpent")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-surface-alt/50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground num">
                  <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <Phone className="size-3" />
                    {c.phone}
                  </a>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.address || "—"}</td>
                <td className="px-4 py-3 num">{c.ordersCount}</td>
                <td className="px-4 py-3 num font-bold">{fmt(c.totalSpent)}</td>
                <td className="px-4 py-3 text-end">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => startEdit(c)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => remove(c)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
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
            {items.length === 0 ? t("customers.empty") : "Aucun résultat."}
          </p>
        )}
      </div>
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
