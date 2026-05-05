import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe, CheckCircle, Clock, AlertCircle, Trash2, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useMockApi } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import type { DomainInfo } from "@/lib/api/types";

export const Route = createFileRoute("/dashboard/domains")({
  component: DomainsPage,
});

function DomainsPage() {
  const { store } = useAuth();
  const isMock    = useMockApi();
  const [info, setInfo]       = useState<DomainInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [domain, setDomain]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ verified: boolean; resolved?: string | null } | null>(null);
  const [copied, setCopied]   = useState<string | null>(null);

  const load = () => {
    if (isMock || !store) return;
    setLoading(true);
    api.getDomain()
      .then(d => { setInfo(d); if (d.domain) setDomain(d.domain); })
      .catch(e => toast.error(e instanceof Error ? e.message : "Échec du chargement"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [store?.id]);

  const save = async () => {
    const trimmed = domain.trim().toLowerCase();
    if (!trimmed || isMock) return;
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(trimmed)) {
      toast.error("Format de domaine invalide. Ex: shop.example.com");
      return;
    }
    setSaving(true);
    try {
      const d = await api.setDomain(trimmed);
      setInfo(d);
      setCheckResult(null);
      toast.success("Domaine enregistré. Configurez votre DNS pour vérifier.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirm("Supprimer ce domaine personnalisé ?") || isMock) return;
    try {
      await api.removeDomain();
      setInfo(v => v ? { ...v, domain: null, verified: false } : v);
      setDomain("");
      setCheckResult(null);
      toast.success("Domaine supprimé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const checkDns = async () => {
    if (isMock) return;
    setChecking(true);
    try {
      const r = await api.checkDomain();
      setCheckResult({ verified: r.verified, resolved: r.resolved });
      if (r.verified) {
        toast.success("Domaine vérifié");
        load();
      } else {
        toast.warning("DNS pas encore propagé. Réessayez dans quelques minutes.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally { setChecking(false); }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const serverIp = info?.serverIp ?? "0.0.0.0";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Domaine personnalisé</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connectez votre propre domaine à votre boutique ETWIN
        </p>
      </div>

      {isMock && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6">
          ⚠️ Domaine personnalisé nécessite le backend PHP. Connectez <code>VITE_PHP_API_BASE</code> pour activer.
        </div>
      )}

      {/* Current domain status */}
      {info?.domain && (
        <div className={`mb-6 p-5 rounded-2xl border ${info.verified ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {info.verified
                ? <CheckCircle className="size-5 text-green-600 shrink-0" />
                : <Clock className="size-5 text-amber-600 shrink-0" />
              }
              <div>
                <p className="font-semibold text-sm">{info.domain}</p>
                <p className={`text-xs ${info.verified ? "text-green-600" : "text-amber-600"}`}>
                  {info.verified ? "✓ Domaine vérifié et actif" : "En attente de vérification DNS"}
                </p>
              </div>
            </div>
            <button
              onClick={remove}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Supprimer le domaine"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Set domain form */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="size-5 text-primary" />
          <h2 className="font-semibold">Configurer le domaine</h2>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="shop.votre-domaine.com"
            dir="ltr"
            className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={save}
            disabled={saving || !domain.trim()}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? "…" : "Enregistrer"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Entrez votre sous-domaine ou domaine racine (ex: <code>shop.example.com</code> ou <code>example.com</code>)
        </p>
      </div>

      {/* DNS Instructions */}
      {info?.domain && !info.verified && (
        <div className="bg-white rounded-2xl border border-border p-6 mb-5">
          <h2 className="font-semibold mb-1">Instructions DNS</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Ajoutez ces enregistrements DNS chez votre registrar (Namecheap, GoDaddy, Cloudflare…)
          </p>

          <div className="space-y-3">
            {(info.instructions ?? []).map((row, i) => (
              <div key={i} className="grid grid-cols-[60px_60px_1fr_60px] gap-2 items-center p-3 bg-muted/50 rounded-xl text-sm font-mono">
                <span className="font-bold text-primary text-xs">{row.type}</span>
                <span className="text-muted-foreground text-xs">{row.host}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-xs">{row.value}</span>
                </div>
                <button
                  onClick={() => copy(row.value, `${i}`)}
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  {copied === `${i}` ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            ))}
          </div>

          {/* IP box */}
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-primary">Adresse IP du serveur</p>
                <p className="text-lg font-mono font-bold mt-0.5">{serverIp}</p>
              </div>
              <button
                onClick={() => copy(serverIp, "ip")}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                {copied === "ip" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                Copier
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            ⏱️ La propagation DNS peut prendre 15 minutes à 48 heures.
          </p>

          {/* Verify button */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={checkDns}
              disabled={checking}
              className="flex items-center gap-2 bg-primary text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} />
              {checking ? "Vérification…" : "Vérifier la configuration DNS"}
            </button>
          </div>

          {checkResult && (
            <div className={`mt-3 flex items-start gap-2 p-3 rounded-xl text-sm ${
              checkResult.verified ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {checkResult.verified
                ? <><CheckCircle className="size-4 shrink-0 mt-0.5" /> Domaine vérifié avec succès ! Votre boutique est accessible sur <strong className="font-mono">{info.domain}</strong></>
                : <>
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>
                      DNS non configuré.{" "}
                      {checkResult.resolved
                        ? <>IP résolue: <code>{checkResult.resolved}</code>, attendue: <code>{serverIp}</code></>
                        : "Le domaine ne peut pas être résolu."}
                    </span>
                  </>
              }
            </div>
          )}
        </div>
      )}

      {/* Verified success */}
      {info?.domain && info.verified && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
              <CheckCircle className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Domaine actif</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Votre boutique est accessible sur{" "}
                <a
                  href={`https://${info.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-mono"
                >
                  {info.domain}
                </a>
              </p>
              {info.verifiedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Vérifié le {new Date(info.verifiedAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
