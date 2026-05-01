import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api/client";
import type { Product, ProductStatus } from "@/lib/api/types";
import { ImageUploader } from "@/components/ImageUploader";
import { DataToolbar } from "@/components/DataToolbar";

export const Route = createFileRoute("/dashboard/products")({
  component: ProductsPage,
});

const blank = (): Omit<Product, "id" | "tenantId" | "createdAt"> => ({
  name: "",
  description: "",
  price: 0,
  image: "",
  extraImages: [],
  stock: 0,
  status: "active" as ProductStatus,
});

function ProductsPage() {
  const { t } = useTranslation();
  const { store } = useAuth();
  const [items, setItems]       = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft]       = useState<Omit<Product, "id" | "tenantId" | "createdAt">>(blank());
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState<string>("");
  const [stockFilter, setStock] = useState<string>("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((p) => !status || p.status === status)
      .filter((p) => {
        if (stockFilter === "out")  return p.stock === 0;
        if (stockFilter === "low")  return p.stock > 0 && p.stock <= 5;
        if (stockFilter === "in")   return p.stock > 5;
        return true;
      })
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [items, search, status, stockFilter]);

  const refresh = () => {
    if (!store) return;
    setLoading(true);
    api.listProducts(store.id).then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id]);

  const startCreate = () => {
    setEditing(null);
    setDraft(blank());
    setCreating(true);
  };
  const startEdit = (p: Product) => {
    setCreating(false);
    setEditing(p);
    setDraft({ name: p.name, description: p.description, price: p.price, image: p.image, extraImages: p.extraImages ?? [], stock: p.stock, status: p.status });
  };
  const cancel = () => {
    setCreating(false);
    setEditing(null);
  };
  const save = async () => {
    if (!store) return;
    if (editing) await api.updateProduct(store.id, editing.id, draft);
    else await api.createProduct(store.id, draft);
    cancel();
    refresh();
  };
  const remove = async (id: string) => {
    if (!store) return;
    await api.deleteProduct(store.id, id);
    refresh();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-4xl font-bold">{t("products.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("products.subtitle")}</p>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="size-4" />
          {t("products.newProduct")}
        </button>
      </div>

      <DataToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un produit…"
        chips={[
          {
            label: "Statut",
            value: status,
            onChange: setStatus,
            options: [
              { value: "active",   label: t("products.active") },
              { value: "draft",    label: t("products.draft") },
              { value: "archived", label: t("products.archived") },
            ],
          },
          {
            label: "Stock",
            value: stockFilter,
            onChange: setStock,
            options: [
              { value: "in",  label: "En stock" },
              { value: "low", label: "Stock faible" },
              { value: "out", label: "Rupture" },
            ],
          },
        ]}
        count={{ filtered: filtered.length, total: items.length }}
      />

      {(creating || editing) && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-6">
          <div className="grid md:grid-cols-[260px_1fr] gap-6">
            {/* Images */}
            <div>
              <span className="text-xs font-medium mb-1.5 block">{t("products.image")}</span>
              <ImageUploader value={draft.image || null} onChange={(url) => setDraft({ ...draft, image: url ?? "" })} aspect="square" label="Main image" />
              <p className="text-[11px] text-muted-foreground mt-2 mb-1">Extra images (gallery)</p>
              <div className="grid grid-cols-3 gap-2">
                {(draft.extraImages ?? []).map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={img} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, extraImages: (draft.extraImages ?? []).filter((_, idx) => idx !== i) })}
                      className="absolute top-1 end-1 size-6 rounded-full bg-foreground/70 text-background flex items-center justify-center"
                      aria-label="Remove"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                {(draft.extraImages?.length ?? 0) < 5 && (
                  <ImageUploader
                    value={null}
                    onChange={(url) => url && setDraft({ ...draft, extraImages: [...(draft.extraImages ?? []), url] })}
                    aspect="square"
                    label="+"
                  />
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={t("products.name")} value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
              <NumberInput label={t("products.price")} value={draft.price} onChange={(v) => setDraft({ ...draft, price: v })} />
              <NumberInput label={t("products.stock")} value={draft.stock} onChange={(v) => setDraft({ ...draft, stock: v })} integer />
              <label className="block">
                <span className="text-xs font-medium mb-1.5 block">{t("products.status")}</span>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as ProductStatus })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="active">{t("products.active")}</option>
                  <option value="draft">{t("products.draft")}</option>
                  <option value="archived">{t("products.archived")}</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium mb-1.5 block">{t("products.description")}</span>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button onClick={cancel} className="px-4 py-2 text-sm rounded-full border border-border hover:bg-surface-alt">
              {t("products.cancel")}
            </button>
            <button onClick={save} className="px-4 py-2 text-sm rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              {t("products.save")}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-start px-6 py-3 font-medium">{t("products.name")}</th>
              <th className="text-start px-6 py-3 font-medium">{t("products.price")}</th>
              <th className="text-start px-6 py-3 font-medium">{t("products.stock")}</th>
              <th className="text-start px-6 py-3 font-medium">{t("products.status")}</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-surface-alt/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="size-10 rounded-lg object-cover bg-muted" />
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 num font-medium">{p.price.toFixed(2)} MAD</td>
                <td className="px-6 py-4 num">{p.stock}</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-border bg-background">
                    {t(`products.${p.status}`)}
                  </span>
                </td>
                <td className="px-6 py-4 text-end">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => remove(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground py-12 text-center">{t("products.empty")}</p>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
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

function NumberInput({ label, value, onChange, integer }: { label: string; value: number; onChange: (v: number) => void; integer?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium mb-1.5 block">{label}</span>
      <input
        type="number"
        step={integer ? 1 : 0.01}
        value={value}
        onChange={(e) => onChange(integer ? parseInt(e.target.value || "0", 10) : parseFloat(e.target.value || "0"))}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring num"
      />
    </label>
  );
}
