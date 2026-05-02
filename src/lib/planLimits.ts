// Frontend warning helpers for plan limits. Server PHP enforces hard blocks too.
import type { Store } from "./api/types";

export const TRIAL_PRODUCT_LIMIT = 10;

export interface LimitInfo {
  current: number;
  limit: number | null;     // null = unlimited
  pct: number;              // 0..100
  warning: boolean;         // ≥80%
  blocked: boolean;         // ≥100%
}

export function productLimit(store: Store | null, currentCount: number): LimitInfo {
  if (!store) return { current: currentCount, limit: null, pct: 0, warning: false, blocked: false };
  if (store.subscription.plan === "pro" && store.subscription.active) {
    return { current: currentCount, limit: null, pct: 0, warning: false, blocked: false };
  }
  const limit = TRIAL_PRODUCT_LIMIT;
  const pct = Math.min(100, Math.round((currentCount / limit) * 100));
  return {
    current: currentCount, limit, pct,
    warning: pct >= 80, blocked: currentCount >= limit,
  };
}

export function isStoreSuspended(store: Store | null): boolean {
  if (!store) return false;
  if (!store.subscription.active) return true;
  return new Date(store.subscription.expiresAt).getTime() <= Date.now();
}
