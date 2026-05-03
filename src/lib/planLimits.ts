// Frontend warning helpers for plan limits. Server PHP enforces hard blocks too.
import type { Store } from "./api/types";

export const PLAN_PRODUCT_LIMIT: Record<string, number | null> = {
  trial:    10,
  starter:  10,
  pro:      null, // unlimited
  business: null,
};

export const PLAN_TEAM_LIMIT: Record<string, number> = {
  trial: 0, starter: 0, pro: 2, business: 10,
};

export interface LimitInfo {
  current: number;
  limit: number | null;     // null = unlimited
  pct: number;              // 0..100
  warning: boolean;         // ≥80%
  blocked: boolean;         // ≥100%
}

export function productLimit(store: Store | null, currentCount: number): LimitInfo {
  if (!store) return { current: currentCount, limit: null, pct: 0, warning: false, blocked: false };
  const plan = store.subscription.plan;
  const active = store.subscription.active;
  const limit = active ? (PLAN_PRODUCT_LIMIT[plan] ?? 10) : 0;
  if (limit === null) return { current: currentCount, limit: null, pct: 0, warning: false, blocked: false };
  const pct = limit === 0 ? 100 : Math.min(100, Math.round((currentCount / limit) * 100));
  return { current: currentCount, limit, pct, warning: pct >= 80, blocked: currentCount >= limit };
}

export function teamLimit(store: Store | null): number {
  if (!store || !store.subscription.active) return 0;
  return PLAN_TEAM_LIMIT[store.subscription.plan] ?? 0;
}

export function isStoreSuspended(store: Store | null): boolean {
  if (!store) return false;
  if (!store.subscription.active) return true;
  return new Date(store.subscription.expiresAt).getTime() <= Date.now();
}

// Legacy alias
export const TRIAL_PRODUCT_LIMIT = 10;
