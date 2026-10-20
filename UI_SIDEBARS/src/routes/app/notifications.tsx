import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Btn, Chip, Panel, SectionHeading } from "@/components/newsiq/kit";
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsRead, 
  addNotificationListener,
  NotificationItem
} from "@/lib/notification-store";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — NEWSIQ Alerts" },
      {
        name: "description",
        content:
          "Breaking news, topic alerts, daily digests and agent recommendations, ranked by relevance to you.",
      },
      { property: "og:title", content: "NEWSIQ Notifications" },
      {
        property: "og:description",
        content: "Breaking alerts and agent recommendations, ranked by relevance.",
      },
    ],
  }),
  component: Notifications,
});

const TONE: Record<string, string> = {
  danger: "var(--color-destructive)",
  primary: "var(--color-primary)",
  highlight: "var(--color-highlight)",
  violet: "var(--color-violet)",
};

const FILTERS = ["All", "Breaking", "Topic alerts", "Digests", "Recommendations"] as const;

type Filter = (typeof FILTERS)[number];

function getFilter(kind: string): Exclude<Filter, "All"> {
  const normalized = kind.toLowerCase();
  if (normalized.includes("breaking")) return "Breaking";
  if (normalized.includes("topic")) return "Topic alerts";
  if (normalized.includes("digest") || normalized.includes("report")) return "Digests";
  return "Recommendations";
}

function Notifications() {
  const [notificationsData, setNotificationsData] = useState<NotificationItem[]>(() => getNotifications());
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    return addNotificationListener(() => {
      setNotificationsData(getNotifications());
    });
  }, []);

  const visibleNotifications = notificationsData.filter(
    (notification) => filter === "All" || getFilter(notification.kind) === filter,
  );
  const unreadCount = notificationsData.filter((notification) => !notification.read).length;

  const handleNotificationClick = (n: NotificationItem) => {
    markNotificationAsRead(n.id);
  };

  const markAllRead = () => {
    markAllNotificationsRead();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHeading
        eyebrow="Signals"
        title="Notifications"
        action={
          <Btn variant="ghost" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Btn>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Chip key={item} active={filter === item} onClick={() => setFilter(item)}>
            {item}
          </Chip>
        ))}
      </div>

      <div className="space-y-3">
        {loading && (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading signals…</p>
        )}
        {!loading && visibleNotifications.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No notifications in this category.
          </p>
        )}
        {visibleNotifications.map((n) => {
          const panel = (
            <Panel
              onClick={() => handleNotificationClick(n)}
              interactive
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 p-5 cursor-pointer"
            >
              <span
                className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                style={{
                  background: `color-mix(in oklab, ${TONE[n.tone || "primary"]} 18%, transparent)`,
                  color: TONE[n.tone || "primary"],
                }}
              >
                <Bell className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: TONE[n.tone || "primary"] }}
                >
                  {n.kind}
                </p>
                <p className="mt-1 text-sm font-medium leading-snug">{n.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!n.read && (
                  <span className="h-2 w-2 rounded-full bg-highlight" aria-label="Unread" />
                )}
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </div>
            </Panel>
          );

          if (n.storyId) {
            return (
              <Link key={n.id} to="/app/story/$storyId" params={{ storyId: n.storyId }} className="block">
                {panel}
              </Link>
            );
          }

          return <div key={n.id}>{panel}</div>;
        })}
      </div>
    </div>
  );
}
