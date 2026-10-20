import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, FolderOpen, Pin } from "lucide-react";
import { Btn, Chip, ConfidenceBar, EmptyState, Panel, SectionHeading } from "@/components/newsiq/kit";
import { StoryCard } from "@/components/newsiq/story-card";
import { STORIES } from "@/lib/newsiq-data";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  getBookmarks, 
  addBookmarkChangeListener, 
  getCollectionProgress,
  getPinnedArticles,
  getArchivedBookmarks,
  archiveBookmark,
  unarchiveBookmark,
  togglePin,
  getBookmarkCollections,
  addBookmarkCollection
} from "@/lib/bookmark-store";

export const Route = createFileRoute("/app/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks — NEWSIQ Library" },
      {
        name: "description",
        content:
          "Collections, pinned reports and reading progress across everything you saved in NEWSIQ.",
      },
      { property: "og:title", content: "NEWSIQ Library" },
      { property: "og:description", content: "Collections, pinned reports and reading progress." },
    ],
  }),
  component: Bookmarks,
});

function Bookmarks() {
  const [savedStories, setSavedStories] = useState(() => getBookmarks());
  const [pinnedIds, setPinnedIds] = useState(() => getPinnedArticles());
  const [archivedStories, setArchivedStories] = useState(() => getArchivedBookmarks());
  const [collections, setCollections] = useState(() => getBookmarkCollections());
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColTopics, setNewColTopics] = useState<string[]>([]);
  const [newColColor, setNewColColor] = useState<"highlight" | "success" | "primary" | "violet">("highlight");

  const AVAILABLE_TOPICS = ["Technology", "Markets", "Science", "Energy", "Health", "Business", "Policy"];

  useEffect(() => {
    return addBookmarkChangeListener(() => {
      setSavedStories(getBookmarks());
      setPinnedIds(getPinnedArticles());
      setArchivedStories(getArchivedBookmarks());
      setCollections(getBookmarkCollections());
    });
  }, []);

  const handleFilterClick = (name: string) => {
    if (selectedFilter === name) {
      setSelectedFilter(null);
    } else {
      setSelectedFilter(name);
    }
  };

  const displayedStories = savedStories.filter((s) => {
    if (!selectedFilter || selectedFilter === "Read later") return true;
    const activeCol = collections.find((c) => c.name === selectedFilter);
    if (!activeCol || !activeCol.topics || activeCol.topics.length === 0) return true;
    return activeCol.topics.includes(s.topic);
  });

  const pinnedStories = savedStories.filter((s) => pinnedIds.includes(s.id));

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Library"
        title="Saved intelligence"
        action={
          <Btn size="sm" onClick={() => setIsModalOpen(true)}>
            <FolderOpen className="h-4 w-4" /> New collection
          </Btn>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {collections.map((c) => {
          let count = 0;
          if (c.name === "Read later") {
            count = savedStories.length;
          } else {
            count = savedStories.filter((s) => c.topics.includes(s.topic)).length;
          }

          const isSelected = selectedFilter === c.name || (c.name === "Read later" && !selectedFilter);

          return (
            <Panel 
              key={c.name} 
              interactive 
              onClick={() => handleFilterClick(c.name)}
              className={cn(
                "p-5 transition-all duration-300 cursor-pointer",
                isSelected 
                  ? c.color === "success"
                    ? "border-success shadow-[0_0_0_1px_color-mix(in oklab,var(--color-success)_22%,transparent),0_30px_90px_-40px_color-mix(in oklab,var(--color-success)_70%,transparent)]"
                    : c.color === "primary"
                    ? "border-primary shadow-[0_0_0_1px_color-mix(in oklab,var(--color-primary)_22%,transparent),0_30px_90px_-40px_color-mix(in oklab,var(--color-primary)_70%,transparent)]"
                    : c.color === "violet"
                    ? "border-violet shadow-[0_0_0_1px_color-mix(in oklab,var(--color-violet)_22%,transparent),0_30px_90px_-40px_color-mix(in oklab,var(--color-violet)_70%,transparent)]"
                    : "border-highlight shadow-[var(--shadow-glow)]"
                  : "border-border"
              )}
            >
              <div className="flex items-start justify-between">
                <div
                  className="grid h-10 w-10 place-items-center rounded-xl"
                  style={{ background: `color-mix(in oklab, var(--color-${c.color}) 20%, transparent)` }}
                >
                  <Bookmark className="h-4 w-4" style={{ color: `var(--color-${c.color})` }} />
                </div>
                <span className="text-xs text-muted-foreground">{count} items</span>
              </div>
              <p className="mt-4 truncate text-sm font-semibold">{c.name}</p>
              <div className="mt-3">
                <ConfidenceBar label="Read" value={getCollectionProgress(c.name, savedStories)} tone={c.color as "primary"} />
              </div>
            </Panel>
          );
        })}
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <SectionHeading title={selectedFilter ? `Recently saved (${selectedFilter})` : "Recently saved"} />
          {displayedStories.length === 0 ? (
            <Panel className="p-8">
              <EmptyState
                icon={<Bookmark className="h-8 w-8 text-muted-foreground" />}
                title={selectedFilter ? `No items in ${selectedFilter}` : "No saved bookmarks"}
                body="Save news stories from the feed or search page to build your intelligence library."
              />
            </Panel>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {displayedStories.map((s) => {
                const isStoryPinned = pinnedIds.includes(s.id);
                return (
                  <div key={s.id} className="group relative flex flex-col">
                    <StoryCard story={s} className="flex-1" />
                    <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur p-1 rounded-xl border border-border">
                      <button
                        title={isStoryPinned ? "Unpin story" : "Pin story"}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          togglePin(s.id);
                        }}
                        className={`p-1.5 rounded-lg hover:bg-card-hover transition-colors cursor-pointer ${
                          isStoryPinned ? "text-highlight" : "text-muted-foreground"
                        }`}
                      >
                        <Pin className={`h-3.5 w-3.5 ${isStoryPinned ? "fill-highlight" : ""}`} />
                      </button>
                      <button
                        title="Archive story"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          archiveBookmark(s);
                        }}
                        className="p-1.5 rounded-lg hover:bg-card-hover text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Panel className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Pin className="h-4 w-4 text-highlight" /> Pinned
            </p>
            <div className="mt-3 space-y-3">
              {pinnedStories.map((s) => (
                <div key={s.id} className="group relative flex flex-col">
                  <StoryCard story={s} variant="compact" />
                  <button
                    title="Unpin story"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePin(s.id);
                    }}
                    className="absolute right-3 top-3 z-10 p-1 rounded-lg hover:bg-card-hover text-highlight transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Pin className="h-3.5 w-3.5 fill-highlight" />
                  </button>
                </div>
              ))}
              {pinnedStories.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">No pinned stories.</p>
              )}
            </div>
          </Panel>

          <Panel className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <FolderOpen className="h-4 w-4 text-highlight" /> Archived
            </p>
            <div className="mt-3 space-y-3">
              {archivedStories.map((s) => (
                <div key={s.id} className="group relative flex items-center justify-between gap-2 p-3 rounded-xl border border-border bg-card/40">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground">{s.topic} · {s.published}</p>
                  </div>
                  <button
                    title="Unarchive story"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      unarchiveBookmark(s);
                    }}
                    className="p-1.5 rounded-lg hover:bg-card-hover text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {archivedStories.length === 0 && (
                <EmptyState
                  icon={<FolderOpen className="h-5 w-5" />}
                  title="Archive is empty"
                  body="Anything you finish reading and clear will land here."
                />
              )}
            </div>
          </Panel>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-6 shadow-2xl animate-in scale-in duration-200">
            <h3 className="text-lg font-bold">New collection</h3>
            <p className="mt-1 text-xs text-muted-foreground">Group your intelligence reports by categories.</p>
            
            <div className="mt-5 space-y-4">
              {/* Collection Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Energy security, Trade policy"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-highlight focus:ring-1 focus:ring-highlight"
                />
              </div>

              {/* Topics Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">Associated Topics</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {AVAILABLE_TOPICS.map((topic) => {
                    const isSelected = newColTopics.includes(topic);
                    return (
                      <Chip
                        key={topic}
                        active={isSelected}
                        onClick={() => {
                          setNewColTopics(prev =>
                            prev.includes(topic)
                              ? prev.filter(t => t !== topic)
                              : [...prev, topic]
                          );
                        }}
                        className="cursor-pointer"
                      >
                        {topic}
                      </Chip>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">Accent Color</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {(["highlight", "success", "primary", "violet"] as const).map((color) => {
                    const isSelected = newColColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColColor(color)}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold capitalize cursor-pointer transition-all",
                          isSelected
                            ? "bg-card border-foreground text-foreground shadow-sm"
                            : "bg-background/40 border-border text-muted-foreground hover:bg-card-hover"
                        )}
                      >
                        <span 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: `var(--color-${color})` }} 
                        />
                        {color === "highlight" ? "Orange" : color === "success" ? "Green" : color === "primary" ? "Blue" : "Purple"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <Btn
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  setNewColName("");
                  setNewColTopics([]);
                  setNewColColor("highlight");
                }}
              >
                Cancel
              </Btn>
              <Btn
                variant="brand"
                size="sm"
                onClick={() => {
                  if (!newColName.trim()) return;
                  addBookmarkCollection(newColName.trim(), newColTopics, newColColor);
                  setIsModalOpen(false);
                  setNewColName("");
                  setNewColTopics([]);
                  setNewColColor("highlight");
                }}
                disabled={!newColName.trim()}
              >
                Create
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
