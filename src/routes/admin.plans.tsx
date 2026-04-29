import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Lock, Unlock, AlertCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import type { PlanFeature } from "@/lib/api/types";

export const Route = createFileRoute("/admin/plans")({
  component: AdminPlansPage,
});

function AdminPlansPage() {
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [saved, setSaved]       = useState<string | null>(null);

  useEffect(() => {
    api.adminGetPlanFeatures()
      .then(setFeatures)
      .finally(() => setLoading(false));
  }, []);

  const togglePlan = async (feature: PlanFeature) => {
    const newPlan = feature.minPlan === "trial" ? "pro" : "trial";
    setSaving(feature.feature);
    try {
      await api.adminUpdatePlanFeature(feature.feature, { minPlan: newPlan });
      setFeatures(prev => prev.map(f =>
        f.feature === feature.feature ? { ...f, minPlan: newPlan } : f
      ));
      setSaved(feature.feature);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  };

  const updateLimit = async (feature: PlanFeature, limit: number) => {
    setSaving(feature.feature);
    try {
      await api.adminUpdatePlanFeature(feature.feature, { trialLimit: limit });
      setFeatures(prev => prev.map(f =>
        f.feature === feature.feature ? { ...f, trialLimit: limit } : f
      ));
      setSaved(feature.feature);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-white/40 text-sm animate-pulse">
      Chargement…
    </div>
  );

  const trialFeatures = features.filter(f => f.minPlan === "trial");
  const proFeatures   = features.filter(f => f.minPlan === "pro");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Plans & Accès</h2>
        <p className="text-xs text-white/40 mt-0.5">
          Contrôlez quelles fonctionnalités sont disponibles pour chaque plan
        </p>
      </div>

      {/* Plan comparison header */}
      <div className="grid grid-cols-2 gap-4">
        <PlanCard
          name="Essai (Trial)"
          color="amber"
          description="14 jours gratuits — fonctionnalités de base"
          count={trialFeatures.length}
        />
        <PlanCard
          name="Pro"
          color="violet"
          description="99 MAD/mois — accès complet"
          count={proFeatures.length + trialFeatures.length}
        />
      </div>

      {/* Feature list */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
          <AlertCircle className="size-4 text-white/40" />
          <p className="text-sm font-semibold text-white">Fonctionnalités contrôlées</p>
        </div>
        <div className="divide-y divide-white/5">
          {features.map(feature => (
            <div key={feature.feature} className="flex items-center gap-4 px-5 py-4">
              {/* Feature info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`size-6 rounded-lg flex items-center justify-center ${
                    feature.minPlan === "trial"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-violet-500/15 text-violet-400"
                  }`}>
                    {feature.minPlan === "trial"
                      ? <Unlock className="size-3.5" />
                      : <Lock className="size-3.5" />
                    }
                  </span>
                  <code className="text-xs font-mono text-white/80">{feature.feature}</code>
                  {saved === feature.feature && (
                    <Check className="size-3.5 text-green-400" />
                  )}
                </div>
                <p className="text-[11px] text-white/40 mt-1 ms-8">{feature.description}</p>
                {/* Trial limit editor (if this is a trial feature with a limit) */}
                {feature.minPlan === "trial" && feature.trialLimit !== null && feature.trialLimit > 0 && (
                  <div className="ms-8 mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-white/40">Limite essai :</span>
                    <input
                      type="number"
                      value={feature.trialLimit}
                      min={1}
                      max={1000}
                      onChange={e => updateLimit(feature, Number(e.target.value))}
                      className="w-20 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>
                )}
              </div>

              {/* Plan badge */}
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  feature.minPlan === "trial"
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-violet-500/15 text-violet-300"
                }`}>
                  {feature.minPlan === "trial" ? "ESSAI" : "PRO"}
                </span>

                {/* Toggle */}
                <button
                  onClick={() => togglePlan(feature)}
                  disabled={saving === feature.feature}
                  className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                    feature.minPlan === "pro" ? "bg-violet-600" : "bg-white/10"
                  }`}
                  title={feature.minPlan === "pro" ? "Passer en Essai" : "Réserver au Pro"}
                >
                  <div className={`absolute top-1 size-4 rounded-full bg-white shadow transition-all ${
                    feature.minPlan === "pro" ? "start-6" : "start-1"
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info note */}
      <p className="text-[11px] text-white/30 text-center">
        Les modifications s'appliquent immédiatement aux nouvelles requêtes. Les utilisateurs existants conservent leur accès jusqu'au renouvellement.
      </p>
    </div>
  );
}

function PlanCard({
  name, color, description, count,
}: {
  name: string;
  color: "amber" | "violet";
  description: string;
  count: number;
}) {
  const cls = color === "amber"
    ? "border-amber-500/20 bg-amber-500/5"
    : "border-violet-500/30 bg-violet-500/10";
  const text = color === "amber" ? "text-amber-300" : "text-violet-300";
  const sub  = color === "amber" ? "text-amber-300/60" : "text-violet-300/60";

  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <p className={`text-sm font-bold ${text}`}>{name}</p>
      <p className={`text-[11px] mt-1 ${sub}`}>{description}</p>
      <p className={`text-2xl font-black mt-3 ${text}`}>{count}</p>
      <p className={`text-[11px] ${sub}`}>fonctionnalité{count > 1 ? "s" : ""} incluse{count > 1 ? "s" : ""}</p>
    </div>
  );
}
