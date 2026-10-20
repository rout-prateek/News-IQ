import { Link, createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import {
  ArrowRight,
  Bookmark,
  Compass,
  Flame,
  GitCompare,
  History,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AISearchBox } from "@/components/newsiq/ai-search-box";
import { Btn, Chip, ConfidenceBar, Panel, SectionHeading } from "@/components/newsiq/kit";
import { StoryCard } from "@/components/newsiq/story-card";
import { STORIES, TOPICS, encodeArticleId } from "@/lib/newsiq-data";
import { getBookmarks, addBookmarkChangeListener, getCollectionProgress, getBookmarkCollections } from "@/lib/bookmark-store";
import { getTrackedTopics, setTrackedTopics, addTopicChangeListener } from "@/lib/topic-store";
import { setQuery } from "@/lib/query-store";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NEWSIQ Intelligence" },
      {
        name: "description",
        content:
          "Your daily intelligence: trending stories, personalised briefs, saved collections and quick AI actions.",
      },
      { property: "og:title", content: "NEWSIQ Dashboard" },
      { property: "og:description", content: "Trending stories, personalised briefs and quick AI actions." },
    ],
  }),
  component: Dashboard,
});

const QUICK_ACTIONS = [
  { icon: ShieldCheck, label: "Verify a claim" },
  { icon: GitCompare, label: "Compare coverage" },
  { icon: History, label: "Build a timeline" },
  { icon: Compass, label: "Map the impact" },
];

function Dashboard() {
  const [storiesData, setStoriesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedStories, setSavedStories] = useState(() => getBookmarks());
  const [collections, setCollections] = useState(() => getBookmarkCollections());
  const { displayName, isGuest } = useAuth();

  const [trackedTopics, setTrackedTopicsState] = useState<string[]>(() => getTrackedTopics());
  const [personalizedStories, setPersonalizedStories] = useState<any[]>([]);
  const [isPersonalizedLoading, setIsPersonalizedLoading] = useState(true);

  useEffect(() => {
    return addBookmarkChangeListener(() => {
      setSavedStories(getBookmarks());
      setCollections(getBookmarkCollections());
    });
  }, []);

  useEffect(() => {
    return addTopicChangeListener(() => {
      setTrackedTopicsState(getTrackedTopics());
    });
  }, []);

  const formatTopicsList = (topics: string[]): string => {
    if (topics.length === 0) return "your personal feed";
    const lowercase = topics.map(t => t.toLowerCase());
    if (lowercase.length === 1) return lowercase[0];
    if (lowercase.length === 2) return `${lowercase[0]} and ${lowercase[1]}`;
    return `${lowercase.slice(0, -1).join(", ")}, and ${lowercase[lowercase.length - 1]}`;
  };

  const handleQuickAction = (label: string, leadTitle?: string) => {
    let queryText = "";
    const topicTitle = leadTitle || "the latest news";
    
    if (label === "Verify a claim") {
      queryText = `Verify claims surrounding: ${topicTitle}`;
    } else if (label === "Compare coverage") {
      queryText = `Compare media coverage and bias on: ${topicTitle}`;
    } else if (label === "Build a timeline") {
      queryText = `Build a chronological timeline of: ${topicTitle}`;
    } else if (label === "Map the impact") {
      queryText = `Map the second-order economic and geopolitical impact of: ${topicTitle}`;
    }

    if (queryText) {
      setQuery(queryText);
    }
  };

  useEffect(() => {
    const fetchPersonalized = async () => {
      setIsPersonalizedLoading(true);
      try {
        const topicsParam = trackedTopics.join(",");
        const res = await fetch(`http://localhost:8000/api/v1/news/feed?limit=4&topics=${encodeURIComponent(topicsParam)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const mapped = data.map((d: any, i: number) => {
              const storyObj = {
                id: d.url || `live-dashboard-${i}`,
                topic: d.category || "General",
                title: d.title,
                dek: d.description || "No description available.",
                published: d.published_at ? new Date(d.published_at).toLocaleDateString() : "Just now",
                image: d.image_url || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
                credibility: Math.floor(Math.random() * 20) + 80,
                impact: "High",
                sources: Math.floor(Math.random() * 5) + 1,
                minutes: Math.floor(Math.random() * 5) + 2,
                content: [],
                signals: []
              };
              return {
                ...storyObj,
                id: encodeArticleId(storyObj)
              };
            });
            setPersonalizedStories(mapped);
          } else {
            const mappedMock = STORIES.filter(s => trackedTopics.includes(s.topic)).slice(0, 4).map((s) => ({
              ...s,
              id: encodeArticleId(s)
            }));
            setPersonalizedStories(mappedMock);
          }
        }
      } catch (e) {
        console.error(e);
        const mappedMock = STORIES.filter(s => trackedTopics.includes(s.topic)).slice(0, 4).map((s) => ({
          ...s,
          id: encodeArticleId(s)
        }));
        setPersonalizedStories(mappedMock);
      } finally {
        setIsPersonalizedLoading(false);
      }
    };
    fetchPersonalized();
  }, [trackedTopics]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/news/trending?limit=10");
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((d: any, i: number) => {
            const storyObj = {
              id: d.url || `trend-${i}`,
              topic: d.source_name || "General",
              title: d.title,
              dek: d.description || "No description available.",
              published: d.published_at ? new Date(d.published_at).toLocaleDateString() : "Just now",
              image: d.image_url || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
              credibility: Math.floor(Math.random() * (99 - 80 + 1)) + 80,
              impact: "High",
              sources: Math.floor(Math.random() * 10) + 1,
              minutes: Math.floor(Math.random() * 10) + 2,
              content: [],
              signals: []
            };
            return {
              ...storyObj,
              id: encodeArticleId(storyObj)
            };
          });
          setStoriesData(mapped);
        }
      } catch (e) {
        console.error(e);
        // Fallback: Base64-encode static stories using the shared function
        const mappedMock = STORIES.map((s) => ({
          ...s,
          id: encodeArticleId(s)
        }));
        setStoriesData(mappedMock);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const [lead, ...rest] = storiesData.length > 0 ? storiesData : STORIES.map((s) => ({
    ...s,
    id: encodeArticleId(s)
  }));
  
  const targetArticle = lead;
  const targetArticleId = targetArticle.id;

  const dailyBriefText = storiesData.length > 0
    ? `"${lead.title}" is the highest-impact event detected in your feed in the last 24 hours.`
    : "The chip accord is the single highest-impact event in your tracked topics this quarter.";

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <section className="animate-rise">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-highlight">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })} · {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'} brief
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {displayName.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-2xl text-subtle">
              {isGuest
                ? "Sign in to unlock personalised intelligence briefings and agent monitoring."
                : "Overnight your agents read 4,208 items. Three narratives shifted, two claims lost their primary source, and one accord changed the semiconductor map."
              }
            </p>
            <div className="mt-6 max-w-2xl">
              <AISearchBox size="md" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.label}
                    to="/app/search"
                    onClick={() => handleQuickAction(a.label, lead?.title)}
                    className="no-underline"
                  >
                    <Chip icon={<Icon className="h-3.5 w-3.5" />} className="cursor-pointer">
                      {a.label}
                    </Chip>
                  </Link>
                );
              })}
            </div>
          </div>

          <Panel className="p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-highlight">
              Daily intelligence
            </p>
            <p className="mt-3 text-sm leading-relaxed text-subtle">
              {dailyBriefText}
            </p>
            <div className="mt-6 space-y-4">
              <ConfidenceBar label="Signal quality" value={targetArticle.credibility || 92} tone="success" />
              <ConfidenceBar label="Narrative agreement" value={targetArticle.credibility ? Math.round(targetArticle.credibility * 0.8) : 71} tone="highlight" />
              <ConfidenceBar label="Unverified claims" value={targetArticle.sources ? Math.round(targetArticle.sources * 1.5) : 18} tone="warning" />
            </div>
            <Link to="/app/story/$storyId" params={{ storyId: targetArticleId }} className="mt-6 block">
              <Btn variant="glass" size="sm" className="w-full">
                Open the brief <ArrowRight className="h-4 w-4" />
              </Btn>
            </Link>
          </Panel>
        </div>
      </section>

      {/* Trending */}
      <section className="space-y-5">
        <SectionHeading
          eyebrow="Trending now"
          title="What moved the world in the last 6 hours"
          action={
            <Link to="/app/feed">
              <Btn variant="ghost" size="sm">
                View feed <ArrowRight className="h-4 w-4" />
              </Btn>
            </Link>
          }
        />
        <StoryCard story={lead} variant="wide" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rest.slice(0, 3).map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      </section>

      {/* Topics + saved */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <SectionHeading eyebrow="Personalised" title={`Because you track ${formatTopicsList(trackedTopics)}`} />
          <div className="grid gap-4 sm:grid-cols-2">
            {isPersonalizedLoading ? (
              <div className="col-span-2 py-10 text-center text-xs text-muted-foreground">
                Loading personalized feed...
              </div>
            ) : personalizedStories.length === 0 ? (
              <div className="col-span-2 py-10 text-center text-xs text-muted-foreground">
                No matching stories found. Toggle more tracked topics below.
              </div>
            ) : (
              personalizedStories.map((s) => (
                <StoryCard key={s.id} story={s} variant="compact" />
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {TOPICS.map((t) => {
              const isTracked = trackedTopics.includes(t);
              return (
                <Chip 
                  key={t} 
                  active={isTracked} 
                  icon={isTracked ? <Flame className="h-3.5 w-3.5" /> : undefined}
                  onClick={() => {
                    const next = isTracked ? trackedTopics.filter((x) => x !== t) : [...trackedTopics, t];
                    setTrackedTopicsState(next);
                    setTrackedTopics(next);
                  }}
                >
                  {t}
                </Chip>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Saved collections</p>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-4">
              {collections.map((c) => {
                let count = 0;
                if (c.name === "Read later") {
                  count = savedStories.length;
                } else {
                  count = savedStories.filter((s) => c.topics.includes(s.topic)).length;
                }

                return (
                  <ConfidenceBar
                    key={c.name}
                    label={`${c.name} · ${count}`}
                    value={getCollectionProgress(c.name, savedStories)}
                    tone={c.color as "primary"}
                  />
                );
              })}
            </div>
            <Link to="/app/bookmarks" className="mt-5 block">
              <Btn variant="outline" size="sm" className="w-full">
                Open library
              </Btn>
            </Link>
          </Panel>

          <Panel className="p-5">
            <p className="text-sm font-semibold">Recent searches</p>
            <div className="mt-3 space-y-1">
              {[
                "chip accord enforcement timeline",
                "who dissented in the rate decision",
                "grid balancing cost europe",
              ].map((q) => (
                <Link
                  key={q}
                  to="/app/search"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-highlight" />
                  <span className="truncate">{q}</span>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}
