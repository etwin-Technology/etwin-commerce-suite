// Super admin impersonation — stores original session and swaps to target store.
import type { Store, User } from "./api/types";

const KEY = "etwin_impersonation";

export interface ImpersonationState {
  originalUser: User;
  originalStore: Store | null;
  originalToken: string;
  originalTenant: string | null;
  targetStoreId: string;
  startedAt: string;
}

export function getImpersonation(): ImpersonationState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as ImpersonationState : null;
  } catch { return null; }
}

export function setImpersonation(s: ImpersonationState | null) {
  if (typeof localStorage === "undefined") return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
}

export function isImpersonating(): boolean {
  return !!getImpersonation();
}
