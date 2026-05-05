import { useMockApi } from "@/lib/api/client";

/**
 * Renders a persistent warning at the top of every page when no live PHP
 * backend is configured (VITE_PHP_API_BASE empty). Prevents accidental
 * production deploys that silently fall back to in-memory mock data.
 */
export function DemoModeBanner() {
  if (!useMockApi()) return null;
  return (
    <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-xs px-4 py-1.5 text-center font-medium">
      ⚠️ Mode démo — aucune donnée n'est sauvegardée. Configurez{" "}
      <code className="font-mono bg-amber-200 px-1 rounded">VITE_PHP_API_BASE</code>{" "}
      pour le mode production.
    </div>
  );
}
