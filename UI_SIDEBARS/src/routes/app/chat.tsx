import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUp, MessageSquarePlus, Pin, Quote, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AIThinking, Btn, Chip, Panel } from "@/components/newsiq/kit";
import { cn } from "@/lib/utils";
import { encodeArticleId } from "@/lib/newsiq-data";
import { 
  getChatThreads, 
  saveThread, 
  togglePinThread, 
  deleteThread, 
  addChatThreadListener,
  ChatThread,
  Msg
} from "@/lib/chat-store";
import { z } from "zod";

export const Route = createFileRoute("/app/chat")({
  validateSearch: z.object({
    prompt: z.string().optional(),
    storyTitle: z.string().optional(),
    storySummary: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "AI Chat — NEWSIQ Research Assistant" },
      {
        name: "description",
        content:
          "Converse with the NEWSIQ research assistant: streaming answers, citation cards and follow-up reasoning over live news.",
      },
      { property: "og:title", content: "NEWSIQ AI Chat" },
      {
        property: "og:description",
        content: "A research assistant that cites every claim it makes.",
      },
    ],
  }),
  component: Chat,
});

type Citation = { label: string; storyId: string };

type ChatResponse = {
  response: string;
  raw_articles: Array<{
    title?: string;
    description?: string;
    url?: string;
    source_name?: string;
    image_url?: string;
  }>;
  metadata?: { recommended_questions?: string[] } | null;
};

const SUGGESTED = [
  "Which claim is weakest here?",
  "Compare the left and right framing",
  "What happens to logistics firms?",
];

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

function AnalysisContent({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);

  return (
    <div className="space-y-4 text-[15px] leading-7 text-subtle">
      {blocks.map((block, index) => {
        const lines = block.trim().split("\n");
        const heading = lines.length === 1 ? lines[0].match(/^(#{1,3})\s+(.+)$/) : null;
        const isList = lines.every((line) => /^\s*[-*]\s+/.test(line));

        if (heading) {
          const level = heading[1].length;
          return (
            <h3
              key={index}
              className={cn(
                "font-display font-semibold tracking-tight text-foreground",
                level === 1 ? "text-2xl" : level === 2 ? "text-xl" : "text-lg",
              )}
            >
              {renderInline(heading[2])}
            </h3>
          );
        }

        if (isList) {
          return (
            <ul key={index} className="space-y-2.5 pl-1">
              {lines.map((line) => (
                <li key={line} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                  <span className="mt-3 h-1.5 w-1.5 rounded-full bg-highlight" />
                  <span>{renderInline(line.replace(/^\s*[-*]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index}>
            {lines.map((line, lineIndex) => (
              <span key={`${line}-${lineIndex}`}>
                {renderInline(line)}
                {lineIndex < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function Chat() {
  const { prompt, storyTitle, storySummary } = Route.useSearch();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState(SUGGESTED);
  
  const [threads, setThreads] = useState(() => getChatThreads());
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const storyPromptSent = useRef(false);

  useEffect(() => {
    return addChatThreadListener(() => {
      setThreads(getChatThreads());
    });
  }, []);

  useEffect(() => {
    if (activeThreadId) {
      const thread = threads.find((t) => t.id === activeThreadId);
      if (thread) {
        setMessages(thread.messages);
        return;
      }
    }
    if (!prompt) {
      setMessages([]);
    }
  }, [activeThreadId, threads, prompt]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const startNewConversation = () => {
    setActiveThreadId(null);
    setMessages([]);
    setInput("");
    setError("");
    setSuggestions(SUGGESTED);
    storyPromptSent.current = false;
  };

  const send = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q || streaming) return;
      
      const newMessages: Msg[] = [...messages, { role: "user", text: q }];
      setMessages(newMessages);
      setInput("");
      setStreaming(true);
      setError("");

      const contextArticle = storyTitle
        ? {
            title: storyTitle,
            description: storySummary,
            source_name: "Story context",
          }
        : undefined;

      const currentThreadId = activeThreadId || `thread-${Date.now()}`;
      const isNew = !activeThreadId;

      void fetch("http://localhost:8000/api/v1/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, context_article: contextArticle }),
      })
        .then(async (response) => {
          const payload = (await response.json().catch(() => null)) as
            ChatResponse | { detail?: string } | null;
          if (!response.ok) {
            throw new Error(
              payload && "detail" in payload
                ? payload.detail
                : "NEWSIQ could not complete that request.",
            );
          }
          if (!payload || !("response" in payload)) {
            throw new Error("NEWSIQ returned an invalid response.");
          }
          return payload;
        })
        .then((response) => {
          const cites = response.raw_articles
            .slice(0, 3)
            .filter((article) => Boolean(article.title))
            .map((article) => ({
              label: [article.source_name, article.title].filter(Boolean).join(" · "),
              storyId: encodeArticleId({
                id: article.url ?? article.title,
                topic: article.source_name ?? "News",
                title: article.title,
                dek: article.description ?? "No description available.",
                published: "Just now",
                image:
                  article.image_url ??
                  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
                credibility: 85,
                impact: "Moderate",
                sources: 1,
                minutes: 4,
                content: [],
                signals: [],
              }),
            }));
          const finalMessages: Msg[] = [...newMessages, { role: "ai", text: response.response, cites }];
          setMessages(finalMessages);
          
          const threadTitle = isNew ? (q.length > 25 ? q.slice(0, 25) + "..." : q) : (threads.find(t => t.id === currentThreadId)?.title || q);
          saveThread({
            id: currentThreadId,
            title: threadTitle,
            pinned: isNew ? false : (threads.find(t => t.id === currentThreadId)?.pinned || false),
            messages: finalMessages,
            createdAt: Date.now()
          });

          if (isNew) {
            setActiveThreadId(currentThreadId);
          }

          if (response.metadata?.recommended_questions?.length) {
            setSuggestions(response.metadata.recommended_questions.slice(0, 3));
          }
        })
        .catch((requestError: unknown) => {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to reach the NEWSIQ service.",
          );
        })
        .finally(() => setStreaming(false));
    },
    [storySummary, storyTitle, streaming, messages, activeThreadId, threads],
  );

  useEffect(() => {
    if (prompt && !storyPromptSent.current) {
      storyPromptSent.current = true;
      send(prompt);
    }
  }, [prompt, send]);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <Btn variant="glass" size="sm" className="w-full" onClick={startNewConversation}>
          <MessageSquarePlus className="h-4 w-4" /> New conversation
        </Btn>
        {(() => {
          const pinnedThreads = threads.filter((t) => t.pinned);
          const recentThreads = threads.filter((t) => !t.pinned);
          return (
            <>
              {pinnedThreads.length > 0 && (
                <>
                  <p className="mb-2 mt-6 px-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Pinned
                  </p>
                  <div className="space-y-1">
                    {pinnedThreads.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "group relative flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-card-hover hover:text-foreground",
                          activeThreadId === t.id ? "bg-card text-foreground" : "text-muted-foreground"
                        )}
                      >
                        <button
                          onClick={() => setActiveThreadId(t.id)}
                          className="flex-1 truncate text-left cursor-pointer outline-none"
                        >
                          {t.title}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            title="Unpin"
                            onClick={() => togglePinThread(t.id)}
                            className="p-1 rounded text-highlight hover:bg-background/50 cursor-pointer outline-none"
                          >
                            <Pin className="h-3.5 w-3.5 fill-highlight" />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => {
                              deleteThread(t.id);
                              if (activeThreadId === t.id) startNewConversation();
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-background/50 cursor-pointer outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <p className="mb-2 mt-6 px-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Recent conversations
              </p>
              <div className="space-y-1">
                {recentThreads.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "group relative flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-card-hover hover:text-foreground",
                      activeThreadId === t.id ? "bg-card text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <button
                      onClick={() => setActiveThreadId(t.id)}
                      className="flex-1 truncate text-left cursor-pointer outline-none"
                    >
                      {t.title}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        title="Pin"
                        onClick={() => togglePinThread(t.id)}
                        className="p-1 rounded text-muted-foreground hover:text-highlight hover:bg-background/50 cursor-pointer outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => {
                          deleteThread(t.id);
                          if (activeThreadId === t.id) startNewConversation();
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-background/50 cursor-pointer outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {recentThreads.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/60 px-3 py-2">No recent conversations.</p>
                )}
              </div>
            </>
          );
        })()}
      </aside>

      <div className="flex min-h-[70vh] flex-col">
        {storyTitle && (
          <div className="mb-5 rounded-2xl border border-highlight/30 bg-highlight/5 px-4 py-3 text-sm text-subtle">
            Discussing: <span className="font-medium text-foreground">{storyTitle}</span>
          </div>
        )}
        <div className="flex-1 space-y-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div className={cn("max-w-2xl", m.role === "user" && "max-w-xl")}>
                {m.role === "user" ? (
                  <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                    {m.text}
                  </div>
                ) : (
                  <Panel className="overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-border bg-background/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-highlight">
                      <Sparkles className="h-3.5 w-3.5" /> NEWSIQ Analysis
                    </div>
                    <div className="p-5 sm:p-6">
                      <AnalysisContent text={m.text} />
                    </div>
                    {m.cites && !!m.text && (
                      <div className="border-t border-border px-5 py-4 sm:px-6">
                        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Sources checked
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {m.cites.map((citation) => (
                            <Link
                              key={citation.storyId}
                              to="/app/story/$storyId"
                              params={{ storyId: citation.storyId }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs text-muted-foreground"
                            >
                              <Quote className="h-3 w-3 text-highlight" />
                              {citation.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </Panel>
                )}
              </div>
            </div>
          ))}
          {streaming && <AIThinking label="Weighing evidence across available sources" />}
          {error && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="sticky bottom-0 mt-8 space-y-3 bg-gradient-to-t from-background via-background to-transparent pt-4">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Chip key={s} onClick={() => send(s)}>
                {s}
              </Chip>
            ))}
          </div>
          <div className="flex items-end gap-3 rounded-2xl border border-border bg-card/70 p-3 backdrop-blur-xl focus-within:shadow-[var(--shadow-glow)]">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask a follow-up…"
              aria-label="Message NEWSIQ"
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => send(input)}
              disabled={streaming}
              aria-label="Send message"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-primary-foreground transition-transform hover:scale-105 disabled:opacity-40 ring-focus"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
