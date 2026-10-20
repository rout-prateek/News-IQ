const KEY = "newsiq:tracked_topics";
const listeners = new Set<() => void>();

export function getTrackedTopics(): string[] {
  if (typeof window === "undefined") return ["Technology", "Markets"];
  const cached = localStorage.getItem(KEY);
  return cached ? JSON.parse(cached) : ["Technology", "Markets"];
}

export function setTrackedTopics(topics: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(topics));
  listeners.forEach((l) => l());
}

export function addTopicChangeListener(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
