import { useEffect, useState } from "react";
import { api, useMockApi } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import type { EffectiveFeatures } from "@/lib/api/types";

/**
 * Permissive defaults for the mock backend so the dashboard isn't entirely
 * locked when running with VITE_PHP_API_BASE empty. Production reads from
 * /api/features which honours plan + per-store overrides.
 */
const MOCK_FEATURES: EffectiveFeatures = {
  custom_domain: true,
  telegram_bot: true,
  pixels: true,
  analytics: true,
  remove_brand: false,
  priority_supp: false,
  excel_export: true,
  whatsapp_orders: true,
  product_limit: null,
  team_limit: 5,
  order_limit: 0,
};

/**
 * Per-session cache so every page that calls this hook doesn't re-fetch.
 * A small TTL keeps it fresh enough after admin changes without thundering
 * the API on every render.
 */
let cached: { data: EffectiveFeatures; at: number } | null = null;
const TTL_MS = 60_000;

export function clearFeaturesCache() {
  cached = null;
}

export function useStoreFeatures(): {
  features: EffectiveFeatures | null;
  loading: boolean;
  refetch: () => void;
} {
  const { isAuthenticated, store } = useAuth();
  const isMock = useMockApi();
  const [features, setFeatures] = useState<EffectiveFeatures | null>(
    cached && Date.now() - cached.at < TTL_MS ? cached.data : null,
  );
  const [loading, setLoading] = useState(!features);

  const load = () => {
    if (isMock) {
      cached = { data: MOCK_FEATURES, at: Date.now() };
      setFeatures(MOCK_FEATURES);
      setLoading(false);
      return;
    }
    if (!isAuthenticated || !store) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.features()
      .then(f => {
        cached = { data: f, at: Date.now() };
        setFeatures(f);
      })
      .catch(() => { /* silent — gating falls back to closed */ })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (cached && Date.now() - cached.at < TTL_MS) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id, isMock, isAuthenticated]);

  return { features, loading, refetch: () => { clearFeaturesCache(); load(); } };
}
