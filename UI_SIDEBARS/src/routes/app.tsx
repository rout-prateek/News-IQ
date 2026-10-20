import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Bookmark,
  LayoutGrid,
  type LucideIcon,
  MessagesSquare,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  User,
  X,
  Menu,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Aurora } from "@/components/newsiq/aurora";
import { Logo } from "@/components/newsiq/logo";
import { cn } from "@/lib/utils";
import { getUnreadNotificationsCount, addNotificationListener, triggerBackgroundPoll } from "@/lib/notification-store";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

type NavItem = { to: string; label: string; icon: LucideIcon; badge?: string };

const PRIMARY: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/app/search", label: "AI Search", icon: Search },
  { to: "/app/chat", label: "AI Chat", icon: MessagesSquare },
  { to: "/app/feed", label: "Your Feed", icon: Sparkles },
];

const SECONDARY: NavItem[] = [
  { to: "/app/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/notifications", label: "Notifications", icon: Bell, badge: "4" },
];

const TERTIARY: NavItem[] = [
  { to: "/app/profile", label: "Profile", icon: User },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeProps={{ "data-active": "true" }}
      className={cn(
        "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground transition-all duration-300",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ring-focus",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-[inset_0_0_0_1px_var(--color-border)]",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0 transition-colors group-data-[active=true]:text-highlight" />
      <span className="truncate">{item.label}</span>
      {item.badge && (
        <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(getUnreadNotificationsCount());
    return addNotificationListener(() => {
      setUnreadCount(getUnreadNotificationsCount());
    });
  }, []);

  const secondaryItems = SECONDARY.map((item) => {
    if (item.to === "/app/notifications") {
      return { ...item, badge: unreadCount > 0 ? String(unreadCount) : undefined };
    }
    return item;
  });

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/" className="px-2 pt-2 ring-focus">
        <Logo />
      </Link>

      <nav className="flex flex-col gap-1">
        {PRIMARY.map((i) => (
          <NavLink key={i.to} item={i} onNavigate={onNavigate} />
        ))}
      </nav>

      <div>
        <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Library
        </p>
        <nav className="flex flex-col gap-1">
          {secondaryItems.map((i) => (
            <NavLink key={i.to} item={i} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>

      <div className="mt-auto flex flex-col gap-1">
        {TERTIARY.map((i) => (
          <NavLink key={i.to} item={i} onNavigate={onNavigate} />
        ))}
        <div className="mt-3 rounded-2xl border border-border bg-card/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-highlight">
            Agents online
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            14 reasoning agents monitoring 12,400 sources for you.
          </p>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full bg-highlight animate-pulse-soft"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useAuth } from "@/lib/useAuth";

function AppShell() {
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { initials, isGuest, displayName, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(getUnreadNotificationsCount());
    return addNotificationListener(() => {
      setUnreadCount(getUnreadNotificationsCount());
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      triggerBackgroundPoll();
    }, 60000); // Poll/Check every 60 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
  }, [light]);

  useEffect(() => setOpen(false), [path]);

  return (
    <div className="relative min-h-screen bg-background">
      <Aurora className="fixed inset-0 opacity-60" />

      <div className="relative mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-sidebar-border bg-sidebar/70 backdrop-blur-2xl lg:block">
          <SidebarBody />
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[280px] border-r border-sidebar-border bg-sidebar animate-rise">
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-full border border-border ring-focus"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarBody onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-2xl">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setOpen(true)}
                  aria-label="Open navigation"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border ring-focus lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <Link to="/app/search" className="min-w-0 flex-1 ring-focus">
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-highlight/40">
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="truncate">Ask NEWSIQ anything…</span>
                  </div>
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setLight((v) => !v)}
                  aria-label="Toggle theme"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground ring-focus"
                >
                  {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
                 <Link
                  to="/app/notifications"
                  aria-label="Notifications"
                  className="relative grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground ring-focus"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </Link>
                <Link
                  to="/app/profile"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-[13px] font-bold text-primary-foreground ring-focus"
                >
                  {initials}
                </Link>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
