import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Drop-in wrapper that visually locks an area when a feature isn't included
 * in the store's plan. Children stay rendered (so users see what they'd get)
 * but pointer events are disabled and an "Upgrade" overlay invites action.
 */
export function FeatureLock({
  locked,
  feature,
  children,
  reason,
  compact,
}: {
  locked: boolean;
  feature: string;
  children: ReactNode;
  reason?: string;
  compact?: boolean;
}) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-50 select-none [&_button]:cursor-not-allowed [&_input]:cursor-not-allowed">
        {children}
      </div>
      <div className={`absolute inset-0 flex ${compact ? "items-center" : "items-end"} justify-center p-3 rounded-2xl bg-gradient-to-t from-background/95 via-background/70 to-transparent`}>
        <div className="bg-card border border-amber-300/40 rounded-xl shadow-lg px-4 py-3 max-w-sm flex items-start gap-3">
          <div className="size-9 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
            <Lock className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Fonctionnalité verrouillée</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {reason ?? `« ${feature} » n'est pas inclus dans votre plan actuel.`}
            </p>
            <Link
              to="/dashboard/subscription"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900"
            >
              <Sparkles className="size-3.5" />
              Passer à un plan supérieur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small badge placed next to a section title when the feature is locked. */
export function FeatureLockBadge({ locked }: { locked: boolean }) {
  if (!locked) return null;
  return (
    <span className="ms-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700">
      <Lock className="size-2.5" /> Verrouillé
    </span>
  );
}
