import { Link } from "@tanstack/react-router";
import { Bookmark, Clock3, Layers } from "lucide-react";
import type { Story } from "@/lib/newsiq-data";
import { cn } from "@/lib/utils";
import { ImpactBadge } from "./kit";
import { useState, useEffect } from "react";
import { isBookmarked, toggleBookmark, addBookmarkChangeListener } from "@/lib/bookmark-store";

export function StoryCard({
  story,
  variant = "default",
  className,
}: {
  story: Story;
  variant?: "default" | "wide" | "compact";
  className?: string;
}) {
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

  const initialImage = story.image && (story.image.startsWith("http") || story.image.startsWith("/") || story.image.includes("assets") || story.image.includes("data:image"))
    ? story.image
    : getFallbackImage(story.topic);

  const [imgSrc, setImgSrc] = useState(initialImage);

  useEffect(() => {
    setImgSrc(initialImage);
  }, [story.image, story.topic]);

  useEffect(() => {
    return addBookmarkChangeListener(() => {
      setSaved(isBookmarked(story.id));
    });
  }, [story.id]);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(story);
  };

  if (variant === "compact") {
    return (
      <Link
        to="/app/story/$storyId"
        params={{ storyId: story.id }}
        className={cn(
          "group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-border bg-card/50 p-4 card-lift",
          className,
        )}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-highlight">
            {story.topic}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{story.title}</h3>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {story.published} · {story.sources} sources
          </p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-xs font-semibold tabular-nums text-success">
          {story.credibility}
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/app/story/$storyId"
      params={{ storyId: story.id }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60 card-lift",
        variant === "wide" && "md:flex-row",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          variant === "wide" ? "md:w-[42%]" : "aspect-[16/9]",
        )}
      >
        <img
          src={imgSrc}
          alt=""
          loading="lazy"
          onError={() => setImgSrc(getFallbackImage(story.topic))}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
            {story.topic}
          </span>
          <ImpactBadge impact={story.impact} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-semibold leading-tight tracking-tight">{story.title}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{story.dek}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {story.credibility} credibility
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> {story.sources}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" /> {story.minutes} min
          </span>
          <button
            onClick={handleSave}
            className={cn(
              "ml-auto inline-flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground cursor-pointer outline-none focus:text-foreground",
              saved && "opacity-100 text-highlight"
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-highlight")} /> {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </Link>
  );
}
