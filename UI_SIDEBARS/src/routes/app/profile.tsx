import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Btn, Chip, ConfidenceBar, Panel, SectionHeading } from "@/components/newsiq/kit";
import { StoryCard } from "@/components/newsiq/story-card";
import { STORIES, TOPICS } from "@/lib/newsiq-data";
import { useAuth } from "@/lib/useAuth";
import { useProfile } from "@/lib/useProfile";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — NEWSIQ" },
      {
        name: "description",
        content:
          "Your NEWSIQ intelligence profile: tracked interests, reading identity, agent tuning and recent activity.",
      },
      { property: "og:title", content: "NEWSIQ Profile" },
      { property: "og:description", content: "Tracked interests, reading identity and agent tuning." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { data: profile } = useProfile();
  const { displayName, initials, isGuest, session } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("http://localhost:8000/api/v1/users/history", {
          headers: session ? { "Authorization": `Bearer ${session.access_token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((h: any, i: number) => ({
            id: h.article?.id || `hist-${i}`,
            topic: h.article?.source_name || "General",
            title: h.article?.title || "Unknown",
            dek: h.article?.description || "",
            published: h.article?.published_at ? new Date(h.article.published_at).toLocaleDateString() : "Just now",
            image: h.article?.image_url || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
            credibility: 85,
            impact: "Moderate",
            bias: 0,
            sources: 2,
            minutes: 4,
            content: [],
            signals: []
          }));
          setHistory(mapped);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);



  const displayHistory = history.length > 0 ? history : STORIES.slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in">
      <Panel className="relative overflow-hidden p-8">
        <div className="absolute inset-x-0 top-0 h-32 opacity-25 bg-brand" aria-hidden />
        <div className="relative grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-brand font-display text-2xl font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{profile?.full_name || displayName}</h1>
            <p className="text-sm text-muted-foreground">{isGuest ? 'Not signed in' : (profile?.email || session?.user?.email)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip>Deep reader</Chip>
              <Chip>Balanced diet</Chip>
              <Chip>Intelligence Agent</Chip>
            </div>
          </div>
          <Link to="/app/settings">
            <Btn variant="outline" size="sm">Edit profile</Btn>
          </Link>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <SectionHeading eyebrow="Activity" title="Recently analysed" />
          <div className="grid gap-4 md:grid-cols-2">
            {displayHistory.slice(0, 4).map((s) => (
              <StoryCard key={s.id} story={s} variant="compact" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Panel className="p-5">
            <p className="text-sm font-semibold">Reading identity</p>
            <div className="mt-4 space-y-4">
              <ConfidenceBar label="Depth over breadth" value={78} tone="primary" />
              <ConfidenceBar label="Source diversity" value={64} tone="violet" />
              <ConfidenceBar label="Verification appetite" value={88} tone="highlight" />
              <ConfidenceBar label="Opinion tolerance" value={31} tone="warning" />
            </div>
          </Panel>

          <Panel className="p-5">
            <p className="text-sm font-semibold">Tracked interests</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TOPICS.map((t, i) => (
                <Chip key={t} active={i % 3 === 0}>
                  {t}
                </Chip>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
