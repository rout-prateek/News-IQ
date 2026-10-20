export type Msg = {
  role: "user" | "ai";
  text: string;
  cites?: Array<{ label: string; storyId: string }>;
};

export type ChatThread = {
  id: string;
  title: string;
  pinned: boolean;
  messages: Msg[];
  createdAt: number;
};

const KEY = "newsiq:chat_threads";

const listeners = new Set<() => void>();

export function addChatThreadListener(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function getChatThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  const cached = localStorage.getItem(KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      return [];
    }
  }
  
  const initial: ChatThread[] = [
    {
      id: "demo-1",
      title: "Chip accord enforcement",
      pinned: true,
      messages: [
        { role: "user", text: "What is the enforcement timeline for the chip accord?" },
        { role: "ai", text: "The enforcement of the chip accord begins in Q1 2026, with full compliance metrics audited by late Q3." }
      ],
      createdAt: Date.now() - 3600000 * 2
    },
    {
      id: "demo-2",
      title: "Rate decision dissents",
      pinned: true,
      messages: [
        { role: "user", text: "Who dissented in the Fed rate decision?" },
        { role: "ai", text: "Fed Governor Bowman dissented, advocating for keeping rates steady rather than cutting them." }
      ],
      createdAt: Date.now() - 3600000 * 24
    }
  ];
  localStorage.setItem(KEY, JSON.stringify(initial));
  return initial;
}

export function getThreadById(id: string): ChatThread | undefined {
  return getChatThreads().find((t) => t.id === id);
}

export function saveThread(thread: ChatThread) {
  if (typeof window === "undefined") return;
  const threads = getChatThreads();
  const idx = threads.findIndex((t) => t.id === thread.id);
  if (idx >= 0) {
    threads[idx] = thread;
  } else {
    threads.unshift(thread);
  }
  localStorage.setItem(KEY, JSON.stringify(threads));
  notifyListeners();
}

export function togglePinThread(id: string) {
  if (typeof window === "undefined") return;
  const threads = getChatThreads();
  const idx = threads.findIndex((t) => t.id === id);
  if (idx >= 0) {
    threads[idx].pinned = !threads[idx].pinned;
    localStorage.setItem(KEY, JSON.stringify(threads));
    notifyListeners();
  }
}

export function deleteThread(id: string) {
  if (typeof window === "undefined") return;
  const threads = getChatThreads();
  const filtered = threads.filter((t) => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(filtered));
  notifyListeners();
}
