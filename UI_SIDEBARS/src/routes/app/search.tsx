import { Link, createFileRoute } from "@tanstack/react-router";
import { Filter, Quote, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { AISearchBox } from "@/components/newsiq/ai-search-box";
import {
  AIThinking,
  Btn,
  Chip,
  EmptyState,
  Panel,
  SectionHeading,
  SkeletonLine,
} from "@/components/newsiq/kit";
import { StoryCard } from "@/components/newsiq/story-card";
import { readQuery, readContextArticle, setContextArticle } from "@/lib/query-store";
import { STORIES, TOPICS, TRENDING_QUESTIONS, encodeArticleId } from "@/lib/newsiq-data";

export const Route = createFileRoute("/app/search")({
  head: () => ({
    meta: [
      { title: "AI Search — NEWSIQ" },
      {
        name: "description",
        content:
          "Ask NEWSIQ in natural language. Multi-agent retrieval returns a synthesised answer with citations, credibility and bias signals.",
      },
      { property: "og:title", content: "NEWSIQ AI Search" },
      { property: "og:description", content: "Natural-language search across 12,400 verified sources." },
    ],
  }),
  component: SearchPage,
});

const FILTERS = ["Last 24h", "Primary sources", "Credibility > 85", "Exclude opinion"];

function renderBoldText(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-semibold text-foreground">{part}</strong>;
    }
    return part;
  });
}

function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-4 text-subtle leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        
        if (trimmed.startsWith("###")) {
          return (
            <h3 key={i} className="text-lg font-bold text-foreground mt-5 mb-2">
              {renderBoldText(trimmed.replace(/^###\s*/, ""))}
            </h3>
          );
        }
        if (trimmed.startsWith("##")) {
          return (
            <h2 key={i} className="text-xl font-bold text-foreground mt-7 mb-2.5">
              {renderBoldText(trimmed.replace(/^##\s*/, ""))}
            </h2>
          );
        }
        if (trimmed.startsWith("#")) {
          return (
            <h1 key={i} className="text-2xl font-bold text-foreground mt-9 mb-3">
              {renderBoldText(trimmed.replace(/^#\s*/, ""))}
            </h1>
          );
        }
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          return (
            <ul key={i} className="list-disc pl-5 my-1">
              <li className="text-sm">
                {renderBoldText(trimmed.replace(/^[*+-]\s*/, ""))}
              </li>
            </ul>
          );
        }
        return (
          <p key={i} className="text-sm">
            {renderBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function SearchPage() {
  const [query, setQueryState] = useState("");
  const [phase, setPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [active, setActive] = useState<string[]>(["Credibility > 85"]);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const q = readQuery();
    const art = readContextArticle();
    if (q) run(q, art);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (q: string, art?: any) => {
    setQueryState(q);
    setPhase("thinking");
    try {
      // If we don't have an explicit context article passed, check if there is one stored
      const contextArt = art !== undefined ? art : readContextArticle();
      
      const res = await fetch("http://localhost:8000/api/v1/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: q,
          context_article: contextArt || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPhase("done");
      // Clear the context article so subsequent generic queries don't keep referencing it
      setContextArticle(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="animate-rise text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Ask, don't browse.</h1>
        <p className="mx-auto mt-3 max-w-xl text-subtle">
          Natural language in. Verified, cited intelligence out.
        </p>
        <div className="mt-8">
          <AISearchBox defaultValue={query} onSubmit={run} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {FILTERS.map((f) => (
            <Chip
              key={f}
              active={active.includes(f)}
              onClick={() =>
                setActive((a) => (a.includes(f) ? a.filter((x) => x !== f) : [...a, f]))
              }
            >
              {f}
            </Chip>
          ))}
        </div>
      </div>

      {phase === "idle" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Panel className="p-6">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-highlight" /> Trending questions
            </p>
            <div className="mt-4 space-y-1">
              {TRENDING_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => run(q)}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground ring-focus"
                >
                  {q}
                </button>
              ))}
            </div>
          </Panel>
          <Panel className="p-6">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-violet" /> Suggested prompts
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <Chip key={t} onClick={() => run(`What is the state of ${t.toLowerCase()} today?`)}>
                  {t}
                </Chip>
              ))}
            </div>
            <div className="mt-6">
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="No query yet"
                body="Pick a prompt or write your own. Agents respond in under two seconds."
              />
            </div>
          </Panel>
        </div>
      )}

      {phase === "thinking" && (
        <Panel className="space-y-5 p-6">
          <AIThinking label="Retrieving · verifying · comparing" />
          <div className="space-y-3">
            <SkeletonLine className="w-11/12" />
            <SkeletonLine className="w-full" />
            <SkeletonLine className="w-9/12" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2 rounded-xl border border-border p-4">
                <SkeletonLine className="w-1/2" />
                <SkeletonLine className="w-full" />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {phase === "done" && (
        <div className="space-y-8 animate-rise">
          <Panel className="p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-highlight">
              Synthesised answer
            </p>
            <h2 className="mt-3 text-xl font-semibold leading-snug">{query}</h2>
            <div className="mt-4">
              {result?.response ? renderMarkdown(result.response) : <p className="leading-relaxed text-subtle">No response generated.</p>}
            </div>
            
            {result?.raw_articles && result.raw_articles.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {result.raw_articles.map((c: any, i: number) => {
                  const storyObj = {
                    id: c.url || `cit-${i}`,
                    topic: c.source_name || "News",
                    title: c.title || "",
                    dek: c.description || "No description available.",
                    published: c.published_at ? new Date(c.published_at).toLocaleDateString() : "Just now",
                    image: c.image_url || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
                    credibility: Math.floor(Math.random() * 20) + 80,
                    impact: "Medium",
                    sources: Math.floor(Math.random() * 5) + 1,
                    minutes: Math.floor(Math.random() * 8) + 2,
                    content: [],
                    signals: []
                  };
                  const encodedId = encodeArticleId(storyObj);
                  return (
                    <Link key={i} to="/app/story/$storyId" params={{ storyId: encodedId }} className="block rounded-xl border border-border bg-background/40 p-4 hover:border-highlight transition-colors">
                      <div className="flex items-center gap-2">
                        <Quote className="h-3.5 w-3.5 text-highlight" />
                        <span className="text-xs text-muted-foreground">Citation {i + 1}</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-success">{c.source_name || "News"} - {new Date(c.published_at || Date.now()).toLocaleDateString()}</p>
                    </Link>
                  );
                })}
              </div>
            )}
            
            <div className="mt-6 flex flex-wrap gap-2">
              {["Why do outlets disagree?", "Show the timeline", "Who is most exposed?"].map((f) => (
                <Chip 
                  key={f} 
                  onClick={() => {
                    const context = result?.raw_articles?.[0];
                    run(`${f} regarding: ${query}`, context);
                  }}
                >
                  {f}
                </Chip>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
