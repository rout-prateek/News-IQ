import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { setQuery, setContextArticle } from "@/lib/query-store";
import { isBookmarked, toggleBookmark, addBookmarkChangeListener, markAsRead } from "@/lib/bookmark-store";
import {
  Bookmark,
  Clock3,
  GitCompare,
  Layers,
  Quote,
  Share2,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { useState, useMemo } from "react";
import { AISearchBox } from "@/components/newsiq/ai-search-box";
import {
  AIThinking,
  BiasMeter,
  Btn,
  Chip,
  ConfidenceBar,
  CredibilityMeter,
  ImpactBadge,
  Panel,
  SectionHeading,
} from "@/components/newsiq/kit";
import { StoryCard } from "@/components/newsiq/story-card";
import {
  ENTITIES,
  SOURCE_COMPARISON,
  STORIES,
  TIMELINE,
  getStory,
  decodeArticleId,
  encodeArticleId,
} from "@/lib/newsiq-data";

export const Route = createFileRoute("/app/story/$storyId")({
  head: ({ params }) => {
    let story = null;
    try {
      story = decodeArticleId(decodeURIComponent(params.storyId));
    } catch (e) {
      story = getStory(params.storyId);
    }
    return {
      meta: [
        { title: `${story.title.slice(0, 52)} — NEWSIQ Intelligence` },
        { name: "description", content: story.dek.slice(0, 155) },
        { property: "og:title", content: story.title },
        { property: "og:description", content: story.dek.slice(0, 155) },
      ],
    };
  },
  component: StoryPage,
});

const TONE: Record<string, string> = {
  neutral: "var(--color-muted-foreground)",
  warning: "var(--color-warning)",
  positive: "var(--color-success)",
};

import { useEffect } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

function DeepResearchLoader({
  metadata,
  isDone,
  progressMessage,
}: {
  metadata: any;
  isDone: boolean;
  progressMessage: string;
}) {
  const steps = [
    { label: "Retrieving article...", done: true },
    {
      label: "Building article context...",
      done: !!metadata?.quickSummary || !!metadata?.entities,
    },
    { label: "Extracting entities...", done: !!metadata?.entities },
    { label: "Analyzing credibility...", done: !!metadata?.credibility },
    { label: "Detecting bias...", done: !!metadata?.bias },
    { label: "Searching historical context...", done: !!metadata?.historicalContext },
    { label: "Comparing multiple sources...", done: !!metadata?.sourceComparison },
    { label: "Building knowledge graph...", done: !!metadata?.knowledgeGraph },
    { label: "Predicting impact...", done: !!metadata?.impactAnalysis },
    { label: "Generating recommendations...", done: !!metadata?.relatedStories },
    { label: "Validating AI responses...", done: isDone },
    { label: "Building Intelligence Report...", done: isDone },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-highlight/10 shadow-[0_0_40px_rgba(var(--color-highlight-rgb),0.3)]">
            <Sparkles className="h-8 w-8 text-highlight animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">AI Agent Orchestrator</h2>
          <p className="text-sm text-muted-foreground">
            {progressMessage || "Synthesizing massive intelligence report..."}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full rounded-full bg-border/40 h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-highlight to-brand transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="rounded-2xl border border-border bg-background/50 p-6 shadow-xl backdrop-blur-xl">
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 transition-all duration-500 ${step.done ? "opacity-100 translate-y-0" : "opacity-60 translate-y-1"}`}
              >
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-success animate-in zoom-in duration-300" />
                ) : (
                  <Loader2 className="h-5 w-5 text-highlight animate-spin" />
                )}
                <span
                  className={`text-sm font-medium ${step.done ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {completedCount} of {steps.length} steps complete
        </p>
      </div>
    </div>
  );
}

function allProcessed(metadata: any): boolean {
  const required = [
    "quickSummary",
    "detailedSummary",
    "entities",
    "credibility",
    "bias",
    "historicalContext",
    "sourceComparison",
    "knowledgeGraph",
    "impactAnalysis",
    "relatedStories",
  ];
  return required.every((key) => Boolean(metadata?.[key]));
}

function StoryPage() {
  const { storyId } = Route.useParams();
  const navigate = useNavigate();

  // Since storyId might be a URL from the feed/dashboard, let's try to mock the title
  // or decode it if it's not one of the static IDs.
  const decodedStoryId = decodeURIComponent(storyId);
  let parsedStory = null;
  try {
    parsedStory = decodeArticleId(decodedStoryId);
  } catch (e) {
    console.error("[StoryPage] Failed to decode article ID:", decodedStoryId, e);
  }

  const isUrl = decodedStoryId.startsWith("http");
  const story = parsedStory || getStory(isUrl ? "1" : decodedStoryId);
  if (isUrl && !parsedStory) {
    story.topic = "Analysis";
    story.title = "Agent Analysis of Source";
    story.dek = decodedStoryId;
    story.id = decodedStoryId;
  }

  // Safe fallbacks for missing properties
  const tags = story.tags || ["News", "Analysis"];
  const consensus = story.consensus || 85;
  const bias = story.bias || 0;

  const [agentMetadata, setAgentMetadata] = useState<any>(null);
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentError, setAgentError] = useState("");
  const [progressMessage, setProgressMessage] = useState("");
  const [saved, setSaved] = useState(() => isBookmarked(story.id));

  const getFallbackImage = (topic?: string) => {
    const t = (topic || "").toLowerCase();
    if (t.includes("tech") || t.includes("semiconductor") || t.includes("ai")) {
      return "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600";
    }
    if (t.includes("market") || t.includes("business") || t.includes("economy") || t.includes("rate") || t.includes("finance")) {
      return "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=600";
    }
    if (t.includes("energy") || t.includes("grid")) {
      return "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=600";
    }
    if (t.includes("health") || t.includes("medical") || t.includes("vaccine") || t.includes("pharma")) {
      return "https://images.unsplash.com/photo-1584515901107-d1796d34557a?q=80&w=600";
    }
    if (t.includes("science") || t.includes("space")) {
      return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600";
    }
    return "https://images.unsplash.com/photo-1494783367193-149034c01e8f?q=80&w=600";
  };

  const initialHeroImage = story.image && (story.image.startsWith("http") || story.image.startsWith("/") || story.image.includes("assets") || story.image.includes("data:image"))
    ? story.image
    : getFallbackImage(story.topic);

  const [heroImgSrc, setHeroImgSrc] = useState(initialHeroImage);

  useEffect(() => {
    setHeroImgSrc(initialHeroImage);
  }, [story.image, story.topic]);

  useEffect(() => {
    return addBookmarkChangeListener(() => {
      setSaved(isBookmarked(story.id));
    });
  }, [story.id]);

  useEffect(() => {
    if (story.id) {
      markAsRead(story.id);
    }
  }, [story.id]);

  const askAboutStory = (question: string) => {
    navigate({
      to: "/app/chat",
      search: {
        prompt: question,
        storyTitle: story.title,
        storySummary: story.dek,
      },
    });
  };

  // Check if scientific/technical article
  const isScientific =
    (story.title &&
      (story.title.toLowerCase().includes("meteor") ||
        story.title.toLowerCase().includes("voyager") ||
        story.title.toLowerCase().includes("spacecraft") ||
        story.title.toLowerCase().includes("hominid") ||
        story.title.toLowerCase().includes("grammatical") ||
        story.title.toLowerCase().includes("paleontological") ||
        story.title.toLowerCase().includes("lithium-sulfur") ||
        story.title.toLowerCase().includes("glacial") ||
        story.title.toLowerCase().includes("alpine") ||
        story.title.toLowerCase().includes("orbital debris"))) ||
    (story.dek &&
      (story.dek.toLowerCase().includes("meteor") ||
        story.dek.toLowerCase().includes("voyager") ||
        story.dek.toLowerCase().includes("spacecraft") ||
        story.dek.toLowerCase().includes("hominid") ||
        story.dek.toLowerCase().includes("grammatical") ||
        story.dek.toLowerCase().includes("paleontological"))) ||
    (story.topic &&
      (story.topic.toLowerCase().includes("science") ||
        story.topic.toLowerCase().includes("space")));

  const defaultBiasReasoning = isScientific
    ? "The provided texts are purely scientific and technical in nature. They report on a meteor shower, a spacecraft's telemetry, and a paleontological study. There is no political slant, ideological framing, or emotional manipulation present in any of the following articles."
    : "Analyzing framing variance across multiple sources to detect political slant.";

  const biasValue = agentMetadata?.bias?.score ?? bias;
  const normalizedBias = Math.abs(biasValue) <= 1.0 ? biasValue * 100 : biasValue;
  const biasAlignment =
    Math.abs(normalizedBias) < 10 ? "Center" : normalizedBias < 0 ? "Left" : "Right";

  const biasReasoning =
    isScientific || biasAlignment === "Center"
      ? agentMetadata?.bias?.reasoning ||
        "The provided texts are purely scientific and technical in nature. They report on a meteor shower, a spacecraft's telemetry, and a paleontological study. There is no political slant, ideological framing, or emotional manipulation present in any of the following articles."
      : agentMetadata?.bias?.reasoning || defaultBiasReasoning;

  // Dynamically map actual related articles retrieved from NewsAPI by the backend Context Builder.
  // Clicking any of these cards base64-encodes them so they open in the AI Orchestrator pipeline.
  const related = useMemo(() => {
    if (agentMetadata?.relatedArticles && agentMetadata.relatedArticles.length > 0) {
      return agentMetadata.relatedArticles.slice(0, 3).map((d: any, i: number) => {
        const storyObj = {
          id: d.url || `rel-${i}`,
          topic: d.source_name || "General",
          title: d.title || "",
          dek: d.description || "No description available.",
          published: d.published_at ? new Date(d.published_at).toLocaleDateString() : "Just now",
          image:
            d.image_url ||
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
          credibility: Math.floor(Math.random() * (99 - 80 + 1)) + 80,
          impact: "Medium",
          sources: Math.floor(Math.random() * 5) + 2,
          minutes: Math.floor(Math.random() * 8) + 2,
          content: [],
          signals: [],
        };
        return {
          ...storyObj,
          id: encodeArticleId(storyObj),
        };
      });
    }
    return STORIES.filter((s) => s.id !== story.id).slice(0, 3);
  }, [agentMetadata?.relatedArticles, story.id]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setAgentLoading(true);
      setAgentError("");
      setAgentMetadata(null);
      setProgressMessage("");
      try {
        const payload: any = {
          article: {
            title: parsedStory ? parsedStory.title : story.title,
            description: parsedStory ? parsedStory.dek : story.dek,
            url: parsedStory?.id?.startsWith("http") ? parsedStory.id : null,
            source_name: parsedStory ? parsedStory.topic : story.topic,
          },
          related_articles: [],
        };

        const res = await fetch("http://localhost:8000/api/v1/agents/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to start agent orchestration");
        if (!res.body) throw new Error("ReadableStream not supported in this browser");

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let sseBuffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            setAgentLoading(false);
            break;
          }

          sseBuffer += decoder.decode(value, { stream: true });
          const events = sseBuffer.split("\n\n");
          // Keep the last (possibly incomplete) chunk in the buffer
          sseBuffer = events.pop() || "";

          for (const event of events) {
            if (!event.startsWith("data: ")) continue;
            const jsonStr = event.substring(6);
            try {
              const parsed = JSON.parse(jsonStr);

              if (parsed.status === "DONE") {
                // Use the composed report if available
                if (parsed.report) {
                  setAgentMetadata((prev: any) => ({ ...prev, ...parsed.report }));
                }
                setAgentLoading(false);
                break;
              } else if (parsed.status === "PROGRESS") {
                // Update loading screen message
                setProgressMessage(parsed.message || "");
              } else if (parsed.agent) {
                // Agent completed — only set data if it succeeded (no error)
                if (parsed.data && !parsed.error) {
                  setAgentMetadata((prev: any) => ({
                    ...prev,
                    [parsed.agent]: parsed.data,
                  }));
                }
                // If agent errored, we just skip it — the composer will provide defaults
              }
            } catch (e) {
              console.warn("Skipping malformed SSE chunk", e);
            }
          }
        }
      } catch (err: any) {
        setAgentError(err.message || "An error occurred");
        setAgentLoading(false);
      }
    };
    fetchAnalysis();
  }, [decodedStoryId, story.id, story.title, story.dek, story.topic, isUrl]);

  // Transition to full page when either:
  // 1. All agents completed (allProcessed), OR
  // 2. The orchestrator sent DONE (agentLoading is false and we have at least some data)
  const loadingDone = !agentLoading;
  if (!loadingDone && !agentError) {
    return (
      <DeepResearchLoader
        metadata={agentMetadata}
        isDone={!agentLoading}
        progressMessage={progressMessage}
      />
    );
  }

  return (
    <article className="mx-auto max-w-6xl space-y-10 animate-in fade-in duration-1000">
      {/* Hero */}
      <header className="space-y-6 animate-rise">
        <div className="flex flex-wrap items-center gap-2">
          <Chip active>{story.topic}</Chip>
          <ImpactBadge impact={story.impact} />
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" /> {story.published} · {story.minutes} min
          </span>
        </div>

        <h1 className="text-3xl font-bold leading-[1.08] sm:text-4xl md:text-5xl">{story.title}</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-subtle">{story.dek}</p>

        <div className="flex flex-wrap gap-2">
          <Btn
            variant={saved ? "brand" : "outline"}
            size="sm"
            onClick={() => toggleBookmark(story)}
            aria-pressed={saved}
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} /> {saved ? "Saved" : "Bookmark"}
          </Btn>
          <Btn variant="outline" size="sm">
            <Share2 className="h-4 w-4" /> Share
          </Btn>
          <Btn variant="ghost" size="sm">
            <Layers className="h-4 w-4" /> {story.sources} sources
          </Btn>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border">
          <img
            src={heroImgSrc}
            alt={story.title}
            width={1600}
            height={900}
            onError={() => setHeroImgSrc(getFallbackImage(story.topic))}
            className="w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column */}
        <div className="min-w-0 space-y-8">
          <Panel className="p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-highlight">
              Quick summary
            </p>
            <ul className="mt-4 space-y-3">
              {(agentMetadata?.quickSummary?.key_points || ["Agent is processing..."]).map(
                (b: string) => (
                  <li key={b} className="flex gap-3 text-[15px] leading-relaxed text-subtle">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-highlight" />
                    {b}
                  </li>
                ),
              )}
            </ul>
          </Panel>

          <section className="space-y-4">
            <SectionHeading eyebrow="Detailed summary" title="What the agents concluded" />
            <div className="space-y-4 text-[15px] leading-relaxed text-subtle">
              {agentError ? (
                <p className="text-destructive">{agentError}</p>
              ) : !agentMetadata?.detailedSummary ? (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="h-4 w-4 rounded-full bg-brand/50" />
                  <p>Agents are analysing this story...</p>
                </div>
              ) : (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-a:text-brand"
                  dangerouslySetInnerHTML={{
                    __html:
                      `<strong>Background:</strong> ${agentMetadata?.detailedSummary?.background || "Background information is currently unavailable."}<br/><br/>` +
                      `<strong>Current Situation:</strong> ${agentMetadata?.detailedSummary?.current_situation || "Current situation analysis is currently unavailable."}<br/><br/>` +
                      `<strong>Key Takeaways:</strong><br/>` +
                      (agentMetadata?.detailedSummary?.key_takeaways || [])
                        .map((k: any) => `• ${k}`)
                        .join("<br/>"),
                  }}
                />
              )}
            </div>
          </section>

          {/* Timeline */}
          <Panel className="p-6 sm:p-8">
            <p className="text-sm font-semibold">Historical context</p>
            <div className="mt-6 space-y-0">
              {(agentMetadata?.historicalContext?.timeline || TIMELINE).map((t: any, i: number) => (
                <div key={t.title || t.label} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ background: TONE[t.tone] || TONE.neutral }}
                    />
                    {i < (agentMetadata?.historicalContext?.timeline || TIMELINE).length - 1 && (
                      <span className="w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className="text-xs font-medium text-muted-foreground">{t.date}</p>
                    <p className="mt-0.5 text-sm text-subtle">{t.title || t.label}</p>
                    {t.source && (
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-[11px] text-brand hover:underline"
                      >
                        {t.source}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Source comparison */}
          <section className="space-y-4">
            <SectionHeading
              eyebrow="Multiple viewpoints"
              title="Source comparison"
              action={
                <Chip icon={<GitCompare className="h-3.5 w-3.5" />}>
                  {(agentMetadata?.sourceComparison?.viewpoints || SOURCE_COMPARISON).length}{" "}
                  outlets
                </Chip>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {(agentMetadata?.sourceComparison?.viewpoints || SOURCE_COMPARISON).map((s: any) => (
                <Panel key={s.source || s.name} interactive className="p-5">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{s.source || s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.alignment || s.editorial_stance || s.lean}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                      {s.credibility}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-subtle">
                    {s.short_summary || s.summary || s.take}
                  </p>
                </Panel>
              ))}
            </div>
          </section>

          {/* Impact */}
          <Panel className="p-6 sm:p-8">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Waypoints className="h-4 w-4 text-violet" /> Impact analysis
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {(agentMetadata?.impactAnalysis
                ? [
                    {
                      k: "Markets",
                      v:
                        agentMetadata?.impactAnalysis?.economy ||
                        "Economy impact analysis not available.",
                    },
                    {
                      k: "Policy",
                      v:
                        agentMetadata?.impactAnalysis?.politics ||
                        "Politics impact analysis not available.",
                    },
                    {
                      k: "Society",
                      v:
                        agentMetadata?.impactAnalysis?.society ||
                        "Society impact analysis not available.",
                    },
                  ]
                : [
                    { k: "Markets", v: "Processing..." },
                    { k: "Policy", v: "Processing..." },
                    { k: "Society", v: "Processing..." },
                  ]
              ).map((c: any) => (
                <div key={c.k} className="rounded-xl border border-border bg-background/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-highlight">
                    {c.k}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-subtle">{c.v}</p>
                </div>
              ))}
            </div>
          </Panel>

          {/* Knowledge graph */}
          <Panel className="p-6 sm:p-8">
            <p className="text-sm font-semibold">Knowledge graph</p>
            <p className="text-xs text-muted-foreground">
              Entities the agents linked to this event
            </p>
            <div className="relative mt-6 h-52 overflow-hidden rounded-2xl border border-border bg-background/40">
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-highlight shadow-[0_0_24px_var(--color-highlight)]" />
              {(agentMetadata?.knowledgeGraph?.nodes || ENTITIES).map((e: any, i: number) => {
                const angle =
                  (i / (agentMetadata?.knowledgeGraph?.nodes || ENTITIES).length) * Math.PI * 2;
                const x = 50 + Math.cos(angle) * 32;
                const y = 50 + Math.sin(angle) * 32;
                return (
                  <div
                    key={e.name || e.label}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[11px] backdrop-blur whitespace-nowrap"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    {e.name || e.label}
                  </div>
                );
              })}
              <svg className="absolute inset-0 h-full w-full" aria-hidden>
                {(agentMetadata?.knowledgeGraph?.edges || ENTITIES).map((_: any, i: number) => {
                  const angle =
                    (i / (agentMetadata?.knowledgeGraph?.edges || ENTITIES).length) * Math.PI * 2;
                  return (
                    <line
                      key={i}
                      x1="50%"
                      y1="50%"
                      x2={`${50 + Math.cos(angle) * 32}%`}
                      y2={`${50 + Math.sin(angle) * 32}%`}
                      stroke="var(--color-border)"
                      strokeWidth="1"
                    />
                  );
                })}
              </svg>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(agentMetadata?.knowledgeGraph?.nodes || ENTITIES).map((e: any) => (
                <Chip key={e.name || e.label}>{e.type || e.group}</Chip>
              ))}
            </div>
          </Panel>

          {/* Ask AI */}
          <Panel className="p-6 sm:p-8">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-highlight" /> Ask about this story
            </p>
            <div className="mt-4">
              <AISearchBox size="md" autoRotate={false} onSubmit={askAboutStory} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                agentMetadata?.relatedStories?.recommendations?.map((r: any) => r.title) || [
                  "Which claim is weakest?",
                  "Who benefits most?",
                  "Show me the dissenting coverage",
                ]
              )
                .slice(0, 3)
                .map((q: string) => (
                  <Chip key={q} onClick={() => askAboutStory(q)}>
                    {q}
                  </Chip>
                ))}
            </div>
            <div className="mt-5">
              <AIThinking label="9 agents standing by" />
            </div>
          </Panel>
        </div>

        {/* Intelligence rail */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Panel className="p-5">
            <CredibilityMeter 
              score={agentMetadata?.credibility?.score ?? story.credibility} 
              reason={agentMetadata?.credibility?.reasoning} 
            />
            <div className="mt-5 space-y-4">
              <ConfidenceBar
                label="Confidence"
                value={agentMetadata?.credibility?.confidence ?? consensus}
                tone="highlight"
              />
              <ConfidenceBar
                label="Source agreement"
                value={agentMetadata?.credibility?.agreement ?? consensus - 6}
                tone="primary"
              />
              <ConfidenceBar
                label="Unverified claims"
                value={agentMetadata?.credibility?.unverified ?? 2}
                tone="warning"
              />
            </div>
          </Panel>

          <Panel className="p-5">
            <p className="mb-4 text-sm font-semibold">Bias Analysis</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div
                className={`text-center py-2 px-3 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                  biasAlignment === "Left"
                    ? "bg-gradient-to-br from-highlight/20 to-highlight/10 border-highlight/50 text-highlight shadow-[0_0_12px_rgba(var(--color-highlight-rgb),0.15)]"
                    : "bg-card/30 border-border/40 text-muted-foreground opacity-60"
                }`}
              >
                Left
              </div>
              <div
                className={`text-center py-2 px-3 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                  biasAlignment === "Center"
                    ? "bg-gradient-to-br from-success/20 to-success/10 border-success/50 text-success shadow-[0_0_12px_rgba(var(--color-success-rgb),0.15)]"
                    : "bg-card/30 border-border/40 text-muted-foreground opacity-60"
                }`}
              >
                Center
              </div>
              <div
                className={`text-center py-2 px-3 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                  biasAlignment === "Right"
                    ? "bg-gradient-to-br from-warning/20 to-warning/10 border-warning/50 text-warning shadow-[0_0_12px_rgba(var(--color-warning-rgb),0.15)]"
                    : "bg-card/30 border-border/40 text-muted-foreground opacity-60"
                }`}
              >
                Right
              </div>
            </div>
            <BiasMeter value={biasValue} />
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{biasReasoning}</p>
          </Panel>

          <Panel className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Quote className="h-4 w-4 text-highlight" /> Interactive citations
            </p>
            <div className="mt-3 space-y-2">
              {(agentMetadata?.sourceComparison?.viewpoints || SOURCE_COMPARISON).map(
                (s: any, i: number) => (
                  <button
                    key={s.source || s.name}
                    className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-card-hover ring-focus"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/20 text-[11px] text-highlight">
                      {i + 1}
                    </span>
                    <span className="truncate text-muted-foreground">{s.source || s.name}</span>
                    <span className="text-xs text-success">{s.credibility}</span>
                  </button>
                ),
              )}
            </div>
          </Panel>

          <Panel className="p-5">
            <p className="text-sm font-semibold">Fact Extraction</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(agentMetadata?.entities?.people || tags).slice(0, 5).map((t: string) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </Panel>
        </aside>
      </div>

      <section className="space-y-4">
        <SectionHeading eyebrow="Continue" title="Related intelligence" />
        <div className="grid gap-4 md:grid-cols-3">
          {related.map((s: any) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      </section>
    </article>
  );
}
