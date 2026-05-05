import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyRound, Search, Crown, Clock, Check, X, RotateCcw, Save,
  Loader2, Building2, Lock, Unlock, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import type {
  AdminStore, FeatureKey, PaginatedResponse, StoreAccessResponse,
} from "@/lib/api/types";

export const Route = createFileRoute("/admin/access")({
  component: AdminAccessPage,
});

/**
 * Super-admin tool to grant per-store access to features beyond the store's
 * billing plan. Pick a store, see plan defaults vs overrides, and toggle
 * access feature-by-feature with optional limit values + expiry.
 */
function AdminAccessPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [stores, setStores] = useState<AdminStore[]>([]);
  const [storeQuery, setStoreQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [access, setAccess] = useState<StoreAccessResponse | null>(null);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingAccess, setLoadingAccess] = useState(false);

  useEffect(() => {
    setLoadingStores(true);
    api.adminStores({ q: storeQuery || undefined })
      .then((p: PaginatedResponse<AdminStore>) => setStores(p.items))
      .catch(e => toast.error(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoadingStores(false));
  }, [storeQuery]);

  useEffect(() => {
    if (!selectedId) { setAccess(null); return; }
    setLoadingAccess(true);
    api.adminGetStoreAccess(selectedId)
      .then(setAccess)
      .catch(e => toast.error(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoadingAccess(false));
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = storeQuery.trim().toLowerCase();
    return q ? stores.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      s.ownerEmail.toLowerCase().includes(q)
    ) : stores;
  }, [stores, storeQuery]);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/40">
        <Lock className="size-10 mb-3" />
        <p className="text-sm">Réservé au Super Admin.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <KeyRound className="size-5 text-amber-400" />
          Accès & Features
        </h2>
        <p className="text-xs text-white/40 mt-0.5">
          Donnez l'accès à des fonctionnalités précises (Excel, domaine, équipe, limites…) sans changer le plan facturé.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Store picker */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-3 h-fit lg:sticky lg:top-4">
          <div className="relative mb-3">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
            <input
              value={storeQuery}
              onChange={e => setStoreQuery(e.target.value)}
              placeholder="Rechercher une boutique…"
              className="w-full ps-9 pe-3 py-2 bg-gray-950 border border-white/10 rounded-xl text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {loadingStores && <p className="text-xs text-white/30 py-4 text-center">Chargement…</p>}
            {!loadingStores && filtered.length === 0 && (
              <p className="text-xs text-white/30 py-4 text-center">Aucune boutique</p>
            )}
            {filtered.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full text-start px-3 py-2.5 rounded-xl text-xs transition-colors ${
                  selectedId === s.id
                    ? "bg-amber-500/15 border border-amber-500/30 text-amber-100"
                    : "hover:bg-white/5 border border-transparent text-white/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="size-3.5 shrink-0 opacity-60" />
                  <span className="font-medium truncate">{s.name}</span>
                </div>
                <div className="flex items-center justify-between mt-1 ms-5">
                  <span className="text-[10px] text-white/40 truncate">{s.ownerEmail}</span>
                  <PlanPill plan={s.plan} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Access editor */}
        <div>
          {!selectedId && (
            <div className="bg-gray-900/60 border border-white/10 border-dashed rounded-2xl p-12 text-center">
              <KeyRound className="size-8 mx-auto text-white/20 mb-3" />
              <p className="text-sm text-white/50">Sélectionnez une boutique pour gérer ses accès.</p>
            </div>
          )}

          {selectedId && loadingAccess && (
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-12 flex items-center justify-center gap-2 text-white/40">
              <Loader2 className="size-4 animate-spin" /> Chargement…
            </div>
          )}

          {selectedId && !loadingAccess && access && (
            <AccessEditor
              key={access.storeId}
              data={access}
              onChanged={() => api.adminGetStoreAccess(selectedId).then(setAccess)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PlanPill({ plan }: { plan: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    starter:  { label: "Starter",  cls: "bg-amber-500/20 text-amber-300" },
    trial:    { label: "Essai",    cls: "bg-amber-500/20 text-amber-300" },
    pro:      { label: "Pro",      cls: "bg-violet-500/20 text-violet-300" },
    business: { label: "Business", cls: "bg-emerald-500/20 text-emerald-300" },
  };
  const m = map[plan] ?? { label: plan, cls: "bg-white/10 text-white/60" };
  return <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${m.cls}`}>{m.label}</span>;
}

function AccessEditor({
  data, onChanged,
}: { data: StoreAccessResponse; onChanged: () => void }) {
  return (
    <div className="space-y-4">
      {/* Store header */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-white/40">Boutique</p>
          <p className="font-bold text-lg">{data.storeName}</p>
          <p className="text-[11px] text-white/40 mt-0.5">ID: <code className="text-white/60">{data.storeId}</code></p>
        </div>
        <div className="text-end">
          <PlanPill plan={data.plan} />
          <p className="text-[11px] text-white/40 mt-1">
            {data.planActive ? <>Expire {new Date(data.expiresAt).toLocaleDateString("fr-FR")}</> : "Plan inactif"}
          </p>
        </div>
      </div>

      {/* Feature list */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
        {data.features.map(f => (
          <FeatureRow
            key={f.feature}
            row={f}
            storeId={data.storeId}
            onChanged={onChanged}
          />
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300/80 text-xs">
        <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
        <span>
          Les overrides actifs prennent toujours le pas sur le plan. Cliquez sur <strong>Réinitialiser</strong> pour
          retirer un override et revenir aux valeurs du plan.
        </span>
      </div>
    </div>
  );
}

function FeatureRow({
  row, storeId, onChanged,
}: { row: StoreAccessResponse["features"][number]; storeId: string; onChanged: () => void }) {
  const isBoolean = row.kind === "boolean";
  const hasOverride = !!row.override;
  const [editing, setEditing] = useState(false);
  const [draftGranted, setDraftGranted] = useState(row.override?.granted ?? planValueIsOn(row.planValue));
  const [draftValue, setDraftValue] = useState<string>(
    row.override?.value != null ? String(row.override.value) :
    typeof row.planValue === "number" ? String(row.planValue) : ""
  );
  const [draftReason, setDraftReason] = useState(row.override?.reason ?? "");
  const [draftExpiry, setDraftExpiry] = useState(row.override?.expiresAt?.slice(0, 10) ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.adminSetStoreAccess(storeId, {
        feature: row.feature as FeatureKey,
        granted: draftGranted,
        value: isBoolean ? null : (draftValue === "" ? null : Number(draftValue)),
        reason: draftReason.trim() || null,
        expiresAt: draftExpiry ? new Date(draftExpiry).toISOString() : null,
      });
      toast.success(`Accès "${row.labelFr}" mis à jour`);
      setEditing(false);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm(`Retirer l'override pour "${row.labelFr}" ?`)) return;
    setSaving(true);
    try {
      await api.adminClearStoreAccess(storeId, row.feature as FeatureKey);
      toast.success("Override retiré");
      setEditing(false);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally { setSaving(false); }
  };

  return (
    <div className="px-5 py-4 hover:bg-white/2 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-white">{row.labelFr}</p>
            <code className="text-[10px] text-white/30">{row.feature}</code>
            {hasOverride && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                OVERRIDE
              </span>
            )}
          </div>
          {row.description && <p className="text-xs text-white/50">{row.description}</p>}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Status badges */}
          <div className="text-end">
            <p className="text-[10px] uppercase tracking-wider text-white/30">Plan</p>
            <ValueBadge value={row.planValue} kind={row.kind} muted />
          </div>
          <div className="text-end">
            <p className="text-[10px] uppercase tracking-wider text-white/30">Effectif</p>
            <ValueBadge value={row.effective} kind={row.kind} />
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Modifier
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 p-4 rounded-xl bg-gray-950 border border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDraftGranted(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                draftGranted
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "border-white/10 text-white/50 hover:border-white/30"
              }`}
            >
              <Unlock className="size-3.5 inline me-1.5" /> Activer pour cette boutique
            </button>
            <button
              type="button"
              onClick={() => setDraftGranted(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                !draftGranted
                  ? "bg-red-500/20 border-red-500/40 text-red-300"
                  : "border-white/10 text-white/50 hover:border-white/30"
              }`}
            >
              <Lock className="size-3.5 inline me-1.5" /> Bloquer (même si plan inclut)
            </button>
          </div>

          {!isBoolean && draftGranted && (
            <label className="block">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                Valeur (vide = illimité)
              </span>
              <input
                type="number"
                min={0}
                value={draftValue}
                onChange={e => setDraftValue(e.target.value)}
                placeholder="ex: 50"
                className="mt-1 w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
              />
            </label>
          )}

          <label className="block">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Raison (optionnel)</span>
            <input
              value={draftReason}
              onChange={e => setDraftReason(e.target.value)}
              maxLength={255}
              placeholder="Bonus VIP, beta tester, support, etc."
              className="mt-1 w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Expire le (optionnel)</span>
            <input
              type="date"
              value={draftExpiry}
              onChange={e => setDraftExpiry(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30"
            />
          </label>

          <div className="flex items-center justify-between gap-2 pt-2">
            {hasOverride ? (
              <button
                onClick={reset}
                disabled={saving}
                className="px-3 py-1.5 text-xs rounded-lg text-red-300 hover:bg-red-500/10 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="size-3.5" /> Retirer l'override
              </button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="px-3 py-1.5 text-xs rounded-lg text-white/60 hover:bg-white/5 inline-flex items-center gap-1.5"
              >
                <X className="size-3.5" /> Annuler
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-3 py-1.5 text-xs rounded-lg bg-amber-500 text-gray-950 font-bold hover:bg-amber-400 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function planValueIsOn(v: unknown): boolean {
  if (v === "on" || v === "unlimited") return true;
  if (typeof v === "number") return v > 0;
  return false;
}

function ValueBadge({ value, kind, muted }: {
  value: "on" | "off" | "unlimited" | number | null;
  kind: "boolean" | "number";
  muted?: boolean;
}) {
  const baseCls = muted ? "text-white/40" : "text-white";
  if (value === null) return <span className={`text-[11px] ${baseCls}`}>—</span>;
  if (kind === "boolean") {
    if (value === "on") return <Check className={`size-4 ${muted ? "text-emerald-400/50" : "text-emerald-400"}`} />;
    return <X className={`size-4 ${muted ? "text-red-400/50" : "text-red-400"}`} />;
  }
  if (value === "unlimited") {
    return <span className={`text-[11px] font-bold ${muted ? "text-emerald-400/60" : "text-emerald-400"}`}>∞</span>;
  }
  if (value === "off") {
    return <X className={`size-4 ${muted ? "text-red-400/50" : "text-red-400"}`} />;
  }
  return <span className={`text-sm font-mono font-bold ${baseCls}`}>{String(value)}</span>;
}
