import type { Story } from "./newsiq-data";

const KEY = "newsiq:bookmarks";
const READ_KEY = "newsiq:read_articles";
const PINNED_KEY = "newsiq:pinned_articles";
const ARCHIVED_KEY = "newsiq:archived_articles";

const listeners = new Set<() => void>();

export function addBookmarkChangeListener(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function getBookmarks(): Story[] {
  if (typeof window === "undefined") return [];
  const cached = localStorage.getItem(KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function isBookmarked(storyId: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some((b) => b.id === storyId);
}

export function toggleBookmark(story: Story) {
  if (typeof window === "undefined") return;
  const bookmarks = getBookmarks();
  const idx = bookmarks.findIndex((b) => b.id === story.id);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.push(story);
  }
  localStorage.setItem(KEY, JSON.stringify(bookmarks));
  notifyListeners();
}

export function getReadArticles(): string[] {
  if (typeof window === "undefined") return [];
  const cached = localStorage.getItem(READ_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function markAsRead(storyId: string) {
  if (typeof window === "undefined") return;
  const read = getReadArticles();
  if (!read.includes(storyId)) {
    read.push(storyId);
    localStorage.setItem(READ_KEY, JSON.stringify(read));
    notifyListeners();
  }
}

export function isRead(storyId: string): boolean {
  return getReadArticles().includes(storyId);
}

const COLLECTIONS_KEY = "newsiq:bookmark_collections";

export type BookmarkCollection = {
  name: string;
  color: "highlight" | "success" | "primary" | "violet";
  topics: string[];
};

const DEFAULT_COLLECTIONS: BookmarkCollection[] = [
  { name: "Read later", color: "highlight", topics: [] },
  { name: "Macro & rates", color: "success", topics: ["Markets", "Business", "Policy"] },
  { name: "Semiconductor watch", color: "primary", topics: ["Technology", "Science"] },
  { name: "Health research", color: "violet", topics: ["Health"] },
];

export function getBookmarkCollections(): BookmarkCollection[] {
  if (typeof window === "undefined") return DEFAULT_COLLECTIONS;
  const cached = localStorage.getItem(COLLECTIONS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      return DEFAULT_COLLECTIONS;
    }
  }
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(DEFAULT_COLLECTIONS));
  return DEFAULT_COLLECTIONS;
}

export function addBookmarkCollection(name: string, topics: string[], color: "highlight" | "success" | "primary" | "violet") {
  if (typeof window === "undefined") return;
  const collections = getBookmarkCollections();
  if (collections.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    return;
  }
  collections.push({ name, topics, color });
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  notifyListeners();
}

export function getCollectionProgress(name: string, savedStories: Story[]): number {
  if (name === "Read later") {
    if (savedStories.length === 0) return 0;
    const readArticles = getReadArticles();
    const readCount = savedStories.filter(s => readArticles.includes(s.id)).length;
    return Math.round((readCount / savedStories.length) * 100);
  }

  const collections = getBookmarkCollections();
  const c = collections.find(col => col.name === name);
  if (!c || !c.topics || c.topics.length === 0) return 0;

  const stories = savedStories.filter(s => c.topics.includes(s.topic));
  if (stories.length === 0) return 0;
  
  const readArticles = getReadArticles();
  const readCount = stories.filter(s => readArticles.includes(s.id)).length;
  
  return Math.round((readCount / stories.length) * 100);
}

export function getPinnedArticles(): string[] {
  if (typeof window === "undefined") return [];
  const cached = localStorage.getItem(PINNED_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function isPinned(storyId: string): boolean {
  return getPinnedArticles().includes(storyId);
}

export function togglePin(storyId: string) {
  if (typeof window === "undefined") return;
  const pinned = getPinnedArticles();
  const idx = pinned.indexOf(storyId);
  if (idx >= 0) {
    pinned.splice(idx, 1);
  } else {
    pinned.push(storyId);
  }
  localStorage.setItem(PINNED_KEY, JSON.stringify(pinned));
  notifyListeners();
}

export function getArchivedBookmarks(): Story[] {
  if (typeof window === "undefined") return [];
  const cached = localStorage.getItem(ARCHIVED_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function isArchived(storyId: string): boolean {
  const archived = getArchivedBookmarks();
  return archived.some((b) => b.id === storyId);
}

export function archiveBookmark(story: Story) {
  if (typeof window === "undefined") return;
  const bookmarks = getBookmarks();
  const idx = bookmarks.findIndex((b) => b.id === story.id);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
    localStorage.setItem(KEY, JSON.stringify(bookmarks));
  }
  const archived = getArchivedBookmarks();
  if (!archived.some((b) => b.id === story.id)) {
    archived.push(story);
    localStorage.setItem(ARCHIVED_KEY, JSON.stringify(archived));
  }
  // Clear pin state on archive
  const pinned = getPinnedArticles();
  const pinIdx = pinned.indexOf(story.id);
  if (pinIdx >= 0) {
    pinned.splice(pinIdx, 1);
    localStorage.setItem(PINNED_KEY, JSON.stringify(pinned));
  }
  notifyListeners();
}

export function unarchiveBookmark(story: Story) {
  if (typeof window === "undefined") return;
  const archived = getArchivedBookmarks();
  const idx = archived.findIndex((b) => b.id === story.id);
  if (idx >= 0) {
    archived.splice(idx, 1);
    localStorage.setItem(ARCHIVED_KEY, JSON.stringify(archived));
  }
  const bookmarks = getBookmarks();
  if (!bookmarks.some((b) => b.id === story.id)) {
    bookmarks.push(story);
    localStorage.setItem(KEY, JSON.stringify(bookmarks));
  }
  notifyListeners();
}
