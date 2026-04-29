import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getAuthToken, getTenantId, setAuthToken, setTenantId } from "./api/client";
import type { Store, User } from "./api/types";

interface SessionState {
  user: User | null;
  store: Store | null; // null for super_admin accounts without a store
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextValue extends SessionState {
  login: (email: string, password: string) => Promise<{ user: User; store: Store | null }>;
  register: (input: { email: string; password: string; fullName: string; storeName: string }) => Promise<{ user: User; store: Store | null }>;
  logout: () => void;
  refreshStore: (store: Store) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = "etwin_session";

interface PersistedSession {
  user: User;
  store: Store | null;
}

function loadSession(): PersistedSession | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

function persistSession(s: PersistedSession | null) {
  if (typeof localStorage === "undefined") return;
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ user: null, store: null, isAuthenticated: false, loading: true });

  useEffect(() => {
    const token = getAuthToken();
    const tenant = getTenantId();
    const session = loadSession();
    if (token && tenant && session) {
      setState({ user: session.user, store: session.store, isAuthenticated: true, loading: false });
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const login: AuthContextValue["login"] = async (email, password) => {
    const res = await api.login(email, password);
    setAuthToken(res.token);
    if (res.store) setTenantId(res.store.id);
    persistSession({ user: res.user, store: res.store });
    setState({ user: res.user, store: res.store, isAuthenticated: true, loading: false });
    return { user: res.user, store: res.store };
  };

  const register: AuthContextValue["register"] = async (input) => {
    const res = await api.register(input);
    setAuthToken(res.token);
    if (res.store) setTenantId(res.store.id);
    persistSession({ user: res.user, store: res.store });
    setState({ user: res.user, store: res.store, isAuthenticated: true, loading: false });
    return { user: res.user, store: res.store };
  };

  const logout = () => {
    setAuthToken(null);
    setTenantId(null);
    persistSession(null);
    setState({ user: null, store: null, isAuthenticated: false, loading: false });
  };

  const refreshStore = (store: Store) => {
    setState((s) => ({ ...s, store }));
    if (state.user) persistSession({ user: state.user, store });
  };

  const value = useMemo<AuthContextValue>(() => ({ ...state, login, register, logout, refreshStore }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
