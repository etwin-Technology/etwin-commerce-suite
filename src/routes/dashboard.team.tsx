import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Shield, X, UserPlus, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, useMockApi } from "@/lib/api/client";
import {
  memberStore, rolePreset, ALL_PERMS, PERMISSION_LABELS,
  type StoreMember, type MemberRole, type Permissions, type PermissionKey,
} from "@/lib/permissions";

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
});

function TeamPage() {
  const { store, user } = useAuth();
  const isMock = useMockApi();
  const [items, setItems] = useState<StoreMember[]>([]);
  const [editing, setEditing] = useState<StoreMember | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!store) return;
    if (isMock) { setItems(memberStore.list(store.id)); return; }
    try {
      const rows = await api.listMembers();
      setItems(rows.map(r => ({
        id: r.id, storeId: r.storeId, email: r.email, fullName: r.fullName,
        role: r.role as MemberRole,
        permissions: r.permissions as unknown as Permissions,
        active: r.active, invitedAt: r.invitedAt,
      })));
    } catch (e) { setError((e as Error).message); }
  }, [store?.id, isMock]);
  useEffect(() => { void refresh(); }, [refresh]);

  if (!store) return null;
  const isOwner = user?.id === store.ownerId;
  const teamUnlocked = store.subscription.active &&
    (store.subscription.plan === "pro" || store.subscription.plan === "business");

  if (!isOwner) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <Lock className="size-10 mx-auto text-muted-foreground mb-3" />
        <h1 className="text-xl font-bold">Accès réservé au propriétaire</h1>
        <p className="text-muted-foreground text-sm mt-1">Seul le propriétaire peut gérer l'équipe.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-4xl font-bold">Équipe</h1>
          <p className="text-muted-foreground mt-1">Invitez des collaborateurs et définissez leurs permissions.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setCreating(true); }}
          disabled={!teamUnlocked}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!teamUnlocked ? "Plan Pro / Business requis" : ""}
        >
          <UserPlus className="size-4" />
          Inviter un membre
        </button>
      </div>

      {!teamUnlocked && (
        <div className="mb-6 rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold mb-1">Fonctionnalité Pro</p>
          <p>L'invitation de collaborateurs est disponible avec le plan Pro. Passez au plan Pro pour ajouter des membres avec rôles personnalisés.</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-start px-4 py-3 font-medium">Membre</th>
              <th className="text-start px-4 py-3 font-medium">Rôle</th>
              <th className="text-start px-4 py-3 font-medium">Permissions</th>
              <th className="text-start px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="bg-violet-50/50">
              <td className="px-4 py-3">
                <div className="font-medium">{user?.fullName} <span className="text-xs text-muted-foreground">(vous)</span></div>
                <div className="text-[11px] text-muted-foreground">{user?.email}</div>
              </td>
              <td className="px-4 py-3">
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 font-bold inline-flex items-center gap-1">
                  <Shield className="size-2.5" /> Propriétaire
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">Toutes les permissions</td>
              <td className="px-4 py-3"><Active /></td>
              <td></td>
            </tr>
            {items.map((m) => (
              <tr key={m.id} className="hover:bg-surface-alt/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{m.fullName}</div>
                  <div className="text-[11px] text-muted-foreground">{m.email}</div>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={m.role} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {Object.values(m.permissions).filter(Boolean).length} / {ALL_PERMS.length} activées
                </td>
                <td className="px-4 py-3">{m.active ? <Active /> : <Suspended />}</td>
                <td className="px-4 py-3 text-end">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => { setCreating(false); setEditing(m); }} className="text-xs text-primary hover:underline">Modifier</button>
                    <button onClick={async () => {
                      if (!confirm(`Retirer ${m.fullName} ?`)) return;
                      try {
                        if (isMock) memberStore.remove(m.id);
                        else await api.deleteMember(m.id);
                        await refresh();
                      } catch (e) { setError((e as Error).message); }
                    }} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground py-12 text-center">Aucun collaborateur. Invitez votre premier membre.</p>
        )}
      </div>

      {(creating || editing) && (
        <MemberModal
          storeId={store.id}
          existing={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: MemberRole }) {
  const map: Record<MemberRole, { label: string; cls: string }> = {
    owner:  { label: "Propriétaire", cls: "bg-violet-500/10 text-violet-700" },
    sales:  { label: "Ventes",       cls: "bg-blue-500/10 text-blue-700" },
    stock:  { label: "Stock",        cls: "bg-emerald-500/10 text-emerald-700" },
    custom: { label: "Personnalisé", cls: "bg-amber-500/10 text-amber-700" },
  };
  const r = map[role];
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${r.cls}`}>{r.label}</span>;
}

const Active = () => <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-bold">Actif</span>;
const Suspended = () => <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 font-bold">Suspendu</span>;

function MemberModal({
  storeId, existing, onClose, onSaved,
}: {
  storeId: string;
  existing: StoreMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email,    setEmail]    = useState(existing?.email ?? "");
  const [fullName, setFullName] = useState(existing?.fullName ?? "");
  const [role,     setRole]     = useState<MemberRole>(existing?.role ?? "sales");
  const [perms,    setPerms]    = useState<Permissions>(existing?.permissions ?? rolePreset("sales"));
  const [active,   setActive]   = useState(existing?.active ?? true);

  const onPickRole = (r: MemberRole) => {
    setRole(r);
    if (r !== "custom") setPerms(rolePreset(r));
  };
  const togglePerm = (k: PermissionKey) => {
    setPerms((p) => ({ ...p, [k]: !p[k] }));
    setRole("custom");
  };

  const save = async () => {
    if (!email.trim() || !fullName.trim()) return;
    const isMock = useMockApi();
    try {
      if (isMock) {
        if (existing) memberStore.update(existing.id, { email, fullName, role, permissions: perms, active });
        else memberStore.add({ storeId, email, fullName, role, permissions: perms, active: true });
      } else if (existing) {
        await api.updateMember(existing.id, { role, permissions: perms as unknown as Record<string, boolean>, active, fullName });
      } else {
        await api.createMember({ email, fullName, role, permissions: perms as unknown as Record<string, boolean> });
      }
      onSaved();
    } catch (e) { alert((e as Error).message); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">{existing ? "Modifier le membre" : "Inviter un membre"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="size-4" /></button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          <Field label="Nom complet" value={fullName} onChange={setFullName} />
          <Field label="Email" value={email} onChange={setEmail} type="email" />
        </div>

        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Rôle prédéfini</p>
          <div className="grid grid-cols-3 gap-2">
            {(["sales","stock","custom"] as MemberRole[]).map((r) => (
              <button
                key={r}
                onClick={() => onPickRole(r)}
                className={`py-3 rounded-xl text-sm font-semibold border transition-colors ${
                  role === r
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-foreground hover:border-foreground/30"
                }`}
              >
                {r === "sales" ? "Ventes" : r === "stock" ? "Stock" : "Personnalisé"}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            <strong>Ventes</strong>: gère commandes & clients · <strong>Stock</strong>: gère produits · <strong>Personnalisé</strong>: cocher manuellement
          </p>
        </div>

        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Permissions</p>
          <div className="grid sm:grid-cols-2 gap-1.5 rounded-xl border border-border bg-surface-alt p-3">
            {ALL_PERMS.map((k) => (
              <label key={k} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-background cursor-pointer">
                <input
                  type="checkbox"
                  checked={perms[k]}
                  onChange={() => togglePerm(k)}
                  className="size-4 rounded border-input accent-primary"
                />
                <span className="text-sm">{PERMISSION_LABELS[k]}</span>
              </label>
            ))}
          </div>
        </div>

        {existing && (
          <label className="flex items-center gap-2.5 mb-5">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 rounded border-input accent-primary" />
            <span className="text-sm">Compte actif</span>
          </label>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-full border border-border hover:bg-surface-alt">Annuler</button>
          <button onClick={save} className="px-4 py-2 text-sm rounded-full bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5">
            <Plus className="size-4" />
            {existing ? "Enregistrer" : "Inviter"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
