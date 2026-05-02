import { useNavigate } from "@tanstack/react-router";
import { ShieldAlert, X } from "lucide-react";
import { getImpersonation, setImpersonation } from "@/lib/impersonate";
import { setAuthToken, setTenantId } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

export function ImpersonationBanner() {
  const imp = getImpersonation();
  const navigate = useNavigate();
  const { refreshStore } = useAuth();
  if (!imp) return null;

  const stop = () => {
    setAuthToken(imp.originalToken);
    setTenantId(imp.originalTenant);
    if (imp.originalStore) refreshStore(imp.originalStore);
    setImpersonation(null);
    void navigate({ to: "/admin/stores" });
  };

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-3 text-sm font-medium sticky top-0 z-40">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="size-4 shrink-0" />
        <span className="truncate">
          Mode impersonation — connecté en tant que marchand. <strong>{imp.originalUser.fullName}</strong> (Super Admin)
        </span>
      </div>
      <button
        onClick={stop}
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-950 text-amber-50 px-3 py-1 text-xs font-bold hover:bg-amber-900 shrink-0"
      >
        <X className="size-3" />
        Quitter
      </button>
    </div>
  );
}
