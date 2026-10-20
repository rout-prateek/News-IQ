import { STORIES } from "./newsiq-data";

export type NotificationItem = {
  id: string;
  kind: "Breaking" | "Topic alert" | "Daily digest" | "AI recommendation";
  title: string;
  body: string;
  time: string;
  tone: "danger" | "primary" | "highlight" | "violet";
  read: boolean;
  storyId?: string;
};

const READ_KEY = "newsiq:read_notifications";
const LIST_KEY = "newsiq:notifications_list";
const listeners = new Set<() => void>();

export function addNotificationListener(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function getReadNotificationIds(): string[] {
  if (typeof window === "undefined") return [];
  const cached = localStorage.getItem(READ_KEY);
  return cached ? JSON.parse(cached) : [];
}

export function getNotifications(): NotificationItem[] {
  if (typeof window === "undefined") {
    return getInitialFallbackNotifications();
  }

  const cachedList = localStorage.getItem(LIST_KEY);
  if (!cachedList) {
    const initial = getInitialFallbackNotifications();
    localStorage.setItem(LIST_KEY, JSON.stringify(initial));
    return initial;
  }

  const readIds = getReadNotificationIds();
  const rawList = JSON.parse(cachedList) as Omit<NotificationItem, "read">[];
  return rawList.map((item) => ({
    ...item,
    read: readIds.includes(item.id)
  }));
}

function getInitialFallbackNotifications(): NotificationItem[] {
  const dynamicAlerts: NotificationItem[] = STORIES.slice(0, 3).map((story, index) => {
    const id = `story-alert-${story.id}`;
    const kind = index === 0 ? "Breaking" : "Topic alert";
    const tone = index === 0 ? "danger" : "primary";
    
    return {
      id,
      kind,
      title: story.title,
      body: `${story.topic} · Credibility ${story.credibility}% · ${story.sources} sources converged.`,
      time: story.published,
      tone,
      read: false,
      storyId: story.id
    };
  });

  const templates: NotificationItem[] = [
    {
      id: "tpl-1",
      kind: "Daily digest",
      title: "Your morning intelligence brief is ready",
      body: "6 stories, 2 contradictions flagged, 1 narrative shift detected.",
      time: "6h",
      tone: "highlight",
      read: false,
    },
    {
      id: "tpl-2",
      kind: "AI recommendation",
      title: "You may be missing the logistics angle",
      body: "Three sources you don't follow lead with port capacity effects.",
      time: "9h",
      tone: "violet",
      read: false,
    }
  ];

  return [...dynamicAlerts, ...templates];
}

export function pushNotification(item: Omit<NotificationItem, "read">) {
  if (typeof window === "undefined") return;
  const current = getNotifications().map(({ read, ...rest }) => rest);
  if (current.some(c => c.title === item.title)) return;
  
  const updated = [item, ...current];
  localStorage.setItem(LIST_KEY, JSON.stringify(updated));
  notifyListeners();
}

export function markNotificationAsRead(id: string) {
  if (typeof window === "undefined") return;
  const readIds = getReadNotificationIds();
  if (!readIds.includes(id)) {
    readIds.push(id);
    localStorage.setItem(READ_KEY, JSON.stringify(readIds));
    notifyListeners();
  }
}

export function markAllNotificationsRead() {
  if (typeof window === "undefined") return;
  const allIds = getNotifications().map((n) => n.id);
  localStorage.setItem(READ_KEY, JSON.stringify(allIds));
  notifyListeners();
}

export function getUnreadNotificationsCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

const SIMULATED_ALERTS = [
  {
    kind: "Breaking" as const,
    title: "Global Supply Chain Congestion Escalates",
    body: "Logistics · Ports report average container delays rising to 12 days.",
    tone: "danger" as const,
  },
  {
    kind: "Topic alert" as const,
    title: "New climate report published by IPCC",
    body: "Climate · Temperature anomalies hit record heights in sub-regions.",
    tone: "primary" as const,
  },
  {
    kind: "AI recommendation" as const,
    title: "Verify source credibility on latest rate hike speculation",
    body: "Economy · Three unrated blogs are leading the narratives.",
    tone: "violet" as const,
  },
  {
    kind: "Breaking" as const,
    title: "Sovereign cyber defense network activated",
    body: "Security · Government offices deploy new automated threat response systems.",
    tone: "danger" as const,
  },
  {
    kind: "Topic alert" as const,
    title: "FDA initiates fast-track review of oncology drug",
    body: "Health · Accelerated trials report positive endpoint readouts.",
    tone: "primary" as const,
  }
];

let alertIndex = 0;

export function triggerBackgroundPoll() {
  if (typeof window === "undefined") return;
  
  const current = getNotifications();
  const newStory = STORIES.find(story => !current.some(c => c.storyId === story.id));
  
  if (newStory) {
    pushNotification({
      id: `story-alert-${newStory.id}`,
      kind: "Breaking",
      title: newStory.title,
      body: `${newStory.topic} · Credibility ${newStory.credibility}% · ${newStory.sources} sources converged.`,
      time: "Just now",
      tone: "danger",
      storyId: newStory.id
    });
  } else {
    const sim = SIMULATED_ALERTS[alertIndex % SIMULATED_ALERTS.length];
    alertIndex++;
    
    pushNotification({
      id: `sim-alert-${Date.now()}`,
      kind: sim.kind,
      title: sim.title,
      body: sim.body,
      time: "Just now",
      tone: sim.tone
    });
  }
}
