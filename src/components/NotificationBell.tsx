import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, Package, Settings, Globe, CreditCard } from "lucide-react";
import { api } from "@/lib/api/client";
import type { AppNotification } from "@/lib/api/types";
import { useMockApi } from "@/lib/api/client";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "à l'instant";
  if (mins  < 60) return `il y a ${mins}m`;
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${days}j`;
}

function NotifIcon({ type }: { type: AppNotification["type"] }) {
  const base = "size-8 rounded-lg flex items-center justify-center shrink-0";
  if (type === "order")   return <div className={`${base} bg-blue-500/10 text-blue-500`}><Package className="size-4" /></div>;
  if (type === "payment") return <div className={`${base} bg-green-500/10 text-green-500`}><CreditCard className="size-4" /></div>;
  if (type === "domain")  return <div className={`${base} bg-purple-500/10 text-purple-500`}><Globe className="size-4" /></div>;
  return <div className={`${base} bg-muted text-muted-foreground`}><Settings className="size-4" /></div>;
}

interface Props {
  className?: string;
}

export function NotificationBell({ className = "" }: Props) {
  const [open, setOpen]           = useState(false);
  const [items, setItems]         = useState<AppNotification[]>([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const dropdownRef               = useRef<HTMLDivElement>(null);
  const isMock                    = useMockApi();

  // Poll unread count every 30 s
  useEffect(() => {
    if (isMock) return;
    const fetch = () => api.unreadCount().then(r => setUnread(r.count)).catch(() => {});
    fetch();
    const id = setInterval(fetch, 30_000);
    return () => clearInterval(id);
  }, [isMock]);

  // Load full list when opened
  useEffect(() => {
    if (!open || isMock) return;
    setLoading(true);
    api.listNotifications()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, isMock]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAll = async () => {
    if (isMock) return;
    await api.markAllRead().catch(() => {});
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const markOne = async (id: number) => {
    if (isMock) return;
    await api.markOneRead(id).catch(() => {});
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute top-1 end-1 size-4 flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute end-0 top-full mt-2 w-80 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <CheckCheck className="size-3.5" />
                Tout lire
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
            {loading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                Chargement…
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
              </div>
            )}
            {!loading && items.map(notif => (
              <button
                key={notif.id}
                onClick={() => markOne(notif.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-start hover:bg-accent/50 transition-colors ${
                  notif.isRead ? "opacity-60" : ""
                }`}
              >
                <NotifIcon type={notif.type} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${notif.isRead ? "" : "font-semibold"}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{notif.body}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                {!notif.isRead && (
                  <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-muted/30">
              <p className="text-[11px] text-center text-muted-foreground">
                {items.length} notification{items.length > 1 ? "s" : ""} · {items.filter(n => !n.isRead).length} non lue{items.filter(n => !n.isRead).length > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
