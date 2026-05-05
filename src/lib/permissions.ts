// Team member permissions — Owner / Sales / Stock with custom toggles.
// Stored in localStorage for the mock layer; PHP backend enforces server-side.

export type MemberRole = "owner" | "sales" | "stock" | "custom";

export interface Permissions {
  "orders.read": boolean;
  "orders.write": boolean;
  "orders.delete": boolean;
  "products.read": boolean;
  "products.write": boolean;
  "products.delete": boolean;
  "customers.read": boolean;
  "customers.write": boolean;
  "customers.delete": boolean;
  "settings.read": boolean;
  "settings.write": boolean;
  "billing.access": boolean;
}

export type PermissionKey = keyof Permissions;

/**
 * Default French labels for permissions. Prefer `t(`permissions.${key}`)` in
 * components so Arabic users see translated labels — these strings remain only
 * as a fallback if i18n hasn't loaded yet.
 */
export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  "orders.read":     "Voir les commandes",
  "orders.write":    "Modifier les commandes",
  "orders.delete":   "Supprimer les commandes",
  "products.read":   "Voir les produits",
  "products.write":  "Modifier les produits",
  "products.delete": "Supprimer les produits",
  "customers.read":  "Voir les clients",
  "customers.write": "Modifier les clients",
  "customers.delete":"Supprimer les clients",
  "settings.read":   "Voir les paramètres",
  "settings.write":  "Modifier les paramètres",
  "billing.access":  "Gérer la facturation",
};

export const ALL_PERMS: PermissionKey[] = Object.keys(PERMISSION_LABELS) as PermissionKey[];

export function rolePreset(role: MemberRole): Permissions {
  const allOff = ALL_PERMS.reduce((a, k) => ({ ...a, [k]: false }), {} as Permissions);
  if (role === "owner") {
    return ALL_PERMS.reduce((a, k) => ({ ...a, [k]: true }), {} as Permissions);
  }
  if (role === "sales") {
    return { ...allOff,
      "orders.read": true, "orders.write": true,
      "customers.read": true, "customers.write": true,
      "products.read": true,
    };
  }
  if (role === "stock") {
    return { ...allOff,
      "products.read": true, "products.write": true, "products.delete": true,
      "orders.read": true,
    };
  }
  return allOff;
}

export interface StoreMember {
  id: string;
  storeId: string;
  email: string;
  fullName: string;
  role: MemberRole;
  permissions: Permissions;
  active: boolean;
  invitedAt: string;
}

const KEY = "etwin_members_v1";

function load(): StoreMember[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function persist(list: StoreMember[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export const memberStore = {
  list(storeId: string): StoreMember[] {
    return load().filter(m => m.storeId === storeId);
  },
  add(input: Omit<StoreMember, "id" | "invitedAt">): StoreMember {
    const list = load();
    const m: StoreMember = { ...input, id: `m-${Date.now()}`, invitedAt: new Date().toISOString() };
    list.push(m);
    persist(list);
    return m;
  },
  update(id: string, patch: Partial<StoreMember>): StoreMember | null {
    const list = load();
    const idx = list.findIndex(m => m.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...patch };
    persist(list);
    return list[idx];
  },
  remove(id: string) {
    persist(load().filter(m => m.id !== id));
  },
};

/** Active member context for the logged-in user (mock-layer). */
export function currentMember(storeId: string, userEmail: string): StoreMember | null {
  return memberStore.list(storeId).find(m => m.email === userEmail && m.active) ?? null;
}

/** Owner always has all permissions. Members are limited to their grants. */
export function userCan(perm: PermissionKey, opts: {
  isOwner: boolean;
  member?: StoreMember | null;
}): boolean {
  if (opts.isOwner) return true;
  return !!opts.member?.permissions?.[perm];
}
