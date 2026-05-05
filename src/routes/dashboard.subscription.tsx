import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, CreditCard, Zap, Clock, History, Crown } from "lucide-react";
import { toast } from "sonner";
import { api, useMockApi } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import type { SubscriptionInfo } from "@/lib/api/types";

export const Route = createFileRoute("/dashboard/subscription")({
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { store, refreshStore } = useAuth();
  const isMock = useMockApi();
  const [info, setInfo]         = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (isMock || !store) {
      // Mock data for demo
      setInfo({
        plan: store?.subscription.plan ?? "trial",
        active: store?.subscription.active ?? true,
        expiresAt: store?.subscription.expiresAt ?? new Date(Date.now() + 7 * 86400000).toISOString(),
        daysLeft: 7,
        expired: false,
        plans: [
          { id: "trial", name: "Essai gratuit", price: 0, duration: "14 jours", features: ["1 boutique", "50 produits", "Notifications WhatsApp", "Telegram"] },
          { id: "pro", name: "Pro", price: 99, currency: "MAD", duration: "par mois", features: ["Produits illimités", "Domaine personnalisé", "WhatsApp + Telegram", "Pixels publicitaires", "Support prioritaire", "Statistiques avancées"], recommended: true },
        ],
        history: [],
      });
      setLoading(false);
      return;
    }
    api.getSubscription()
      .then(setInfo)
      .catch(e => toast.error(e instanceof Error ? e.message : "Échec du chargement"))
      .finally(() => setLoading(false));
  }, [store?.id]);

  const upgrade = async (planId: string) => {
    if (!["starter","pro","business"].includes(planId)) return;
    setUpgrading(true);
    try {
      await api.upgradeSubscription(planId as "starter" | "pro" | "business");
      const updated = await api.getSubscription();
      setInfo(updated);
      if (store) {
        const s = await api.getStoreBySlug(store.slug);
        if (s) refreshStore(s);
      }
      toast.success(`Plan ${planId.charAt(0).toUpperCase() + planId.slice(1)} activé !`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la mise à niveau");
    } finally { setUpgrading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Chargement…</div>;
  if (!info) return null;

  const days = info.daysLeft;
  const isPro = info.plan === "pro";
  const isBusiness = info.plan === "business";
  const planLabel = isBusiness ? "Business" : isPro ? "Pro" : info.plan === "starter" ? "Starter" : "Essai gratuit";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Abonnement</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gérez votre plan et consultez l'historique de facturation</p>
      </div>

      {/* Current plan banner */}
      <div className={`rounded-2xl p-6 mb-8 flex items-center justify-between gap-4 ${
        isBusiness ? "bg-gradient-to-r from-emerald-600 to-emerald-800 text-white" :
        isPro ? "bg-gradient-to-r from-violet-600 to-violet-800 text-white" :
        info.expired ? "bg-gradient-to-r from-red-600 to-red-800 text-white" :
        "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
      }`}>
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
            {(isPro || isBusiness) ? <Crown className="size-6" /> : <Clock className="size-6" />}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Plan actuel</p>
            <p className="text-xl font-bold mt-0.5">{planLabel}</p>
            <p className="text-xs opacity-70 mt-0.5">
              {info.expired ? "❌ Expiré — Renouvelez pour continuer" :
               `${days} jour${days > 1 ? "s" : ""} restant${days > 1 ? "s" : ""} · expire le ${new Date(info.expiresAt).toLocaleDateString("fr-FR")}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${info.active && !info.expired ? "bg-white/20" : "bg-white/10 line-through opacity-60"}`}>
            {info.active && !info.expired ? "Actif" : "Inactif"}
          </span>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {info.plans.map(plan => {
          const isCurrentPlan = info.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-6 transition-shadow ${
                plan.recommended
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
                  Recommandé
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-lg">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black">{plan.price}</span>
                    {plan.currency && <span className="text-sm text-muted-foreground font-medium">{plan.currency}</span>}
                    <span className="text-sm text-muted-foreground">/ {plan.duration}</span>
                  </div>
                </div>
                {isCurrentPlan && !info.expired && (
                  <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
                    Votre plan
                  </span>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.id !== "starter" && plan.id !== "trial" && (!isCurrentPlan || info.expired) && (
                <button
                  onClick={() => upgrade(plan.id)}
                  disabled={upgrading}
                  className="w-full py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  <Zap className="size-4" />
                  {upgrading ? "Activation…" : `Passer au ${plan.name}`}
                </button>
              )}
              {isCurrentPlan && !info.expired && plan.id !== "starter" && plan.id !== "trial" && (
                <button
                  onClick={() => upgrade(plan.id)}
                  disabled={upgrading}
                  className="w-full py-2.5 border border-primary text-primary rounded-xl font-semibold text-sm hover:bg-primary/5 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  <CreditCard className="size-4" />
                  {upgrading ? "…" : "Renouveler"}
                </button>
              )}
              {(plan.id === "starter" || plan.id === "trial") && (
                <div className="py-2.5 text-center text-xs text-muted-foreground">
                  Plan d'essai
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Billing history */}
      {info.history.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="size-5 text-muted-foreground" />
            <h2 className="font-semibold">Historique de facturation</h2>
          </div>
          <div className="divide-y divide-border">
            {info.history.map(h => (
              <div key={h.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium capitalize">{h.plan === "pro" ? "Plan Pro" : "Essai"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.startedAt).toLocaleDateString("fr-FR")} → {new Date(h.expiresAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-semibold">{h.amount > 0 ? `${h.amount} MAD` : "Gratuit"}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    h.status === "active" ? "bg-green-100 text-green-700" :
                    h.status === "expired" ? "bg-gray-100 text-gray-600" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {h.status === "active" ? "Actif" : h.status === "expired" ? "Expiré" : "Annulé"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
