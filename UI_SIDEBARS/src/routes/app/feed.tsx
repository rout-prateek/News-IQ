import { createFileRoute } from "@tanstack/react-router";
import { Clock3, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Chip, ConfidenceBar, Panel, SectionHeading } from "@/components/newsiq/kit";
import { StoryCard } from "@/components/newsiq/story-card";
import { getBookmarks, addBookmarkChangeListener, getCollectionProgress, getBookmarkCollections } from "@/lib/bookmark-store";
import { STORIES, TOPICS, encodeArticleId } from "@/lib/newsiq-data";
import { getTrackedTopics, setTrackedTopics, addTopicChangeListener } from "@/lib/topic-store";

export const Route = createFileRoute("/app/feed")({
  head: () => ({
    meta: [
      { title: "Your Feed — NEWSIQ Personalised Intelligence" },
      {
        name: "description",
        content:
          "A feed tuned to your interests: tracked topics, saved collections, reading history and agent recommendations.",
      },
      { property: "og:title", content: "NEWSIQ Personalised Feed" },
      { property: "og:description", content: "Intelligence tuned to the topics you actually track." },
    ],
  }),
  component: Feed,
});

function Feed() {
  const [active, setActive] = useState<string[]>(() => getTrackedTopics());
  const [feedData, setFeedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedStories, setSavedStories] = useState(() => getBookmarks());
  const [collections, setCollections] = useState(() => getBookmarkCollections());

  useEffect(() => {
    return addBookmarkChangeListener(() => {
      setSavedStories(getBookmarks());
      setCollections(getBookmarkCollections());
    });
  }, []);

  useEffect(() => {
    return addTopicChangeListener(() => {
      setActive(getTrackedTopics());
    });
  }, []);
  useEffect(() => {
    const fetchFeed = async () => {
      setIsLoading(true);
      try {
        const topicsParam = active.join(",");
        const res = await fetch(`http://localhost:8000/api/v1/news/feed?limit=24&topics=${encodeURIComponent(topicsParam)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const mapped = data.map((d: any, i: number) => {
              const storyObj = {
                id: d.url || `live-${i}`,
                topic: d.category || "General",
                title: d.title,
                dek: d.description || "No description available.",
                published: d.published_at ? new Date(d.published_at).toLocaleDateString() : "Just now",
                image: d.image_url || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
                credibility: Math.floor(Math.random() * 20) + 80,
                impact: "High",
                bias: 0,
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
            setFeedData(mapped);
          } else {
            // Fallback: NewsAPI is rate-limited (429). Base64-encode mock stories to keep feed functional
            const mappedMock = STORIES.map((s) => {
              const storyObj = {
                ...s,
                id: s.id
              };
              return {
                ...storyObj,
                id: encodeArticleId(storyObj)
              };
            });
            setFeedData(mappedMock);
          }
        }
      } catch (e) {
        console.error("Failed to fetch feed", e);
        const mappedMock = STORIES.map((s) => {
          const storyObj = {
            ...s,
            id: s.id
          };
          return {
            ...storyObj,
            id: encodeArticleId(storyObj)
          };
        });
        setFeedData(mappedMock);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeed();
  }, [active]);

  const filtered = feedData.filter((s) => active.length === 0 || active.includes(s.topic));

  return (
    <div className="space-y-8">
      <SectionHeading eyebrow="Personalised" title="Your intelligence feed" />

      <div className="flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <Chip
            key={t}
            active={active.includes(t)}
            onClick={() => {
              const next = active.includes(t) ? active.filter((x) => x !== t) : [...active, t];
              setActive(next);
              setTrackedTopics(next);
            }}
          >
            {t}
          </Chip>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {isLoading ? (
            <Panel className="flex flex-col items-center justify-center p-20 text-sm text-muted-foreground space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Fetching matching news coverage...</span>
            </Panel>
          ) : filtered.length === 0 ? (
            <Panel className="p-10 text-center text-sm text-muted-foreground">
              No topics selected — pick at least one interest above.
            </Panel>
          ) : (
            filtered.map((s) => <StoryCard key={s.id} story={s} variant="wide" />)
          )}
        </div>

        <div className="space-y-4">
          <Panel className="p-5">
            <p className="text-sm font-semibold">Saved collections</p>
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
          </Panel>

          <Panel className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Clock3 className="h-4 w-4 text-muted-foreground" /> Reading history
            </p>
            <div className="mt-3 space-y-3">
              {STORIES.slice(2, 5).map((s) => (
                <div key={s.id} className="text-sm">
                  <p className="line-clamp-1 text-subtle">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.published} · {s.minutes} min</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-violet" /> Agent recommendation
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You consistently skip the logistics angle on trade stories. Adding it would raise your
              coverage completeness by an estimated 14%.
            </p>
            <div className="mt-4">
              <Chip onClick={() => setActive((a) => [...a, "Economy"])}>Add Economy</Chip>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
