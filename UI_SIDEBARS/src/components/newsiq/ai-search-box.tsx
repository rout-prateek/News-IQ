import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, Command, Sparkle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { setQuery } from "@/lib/query-store";
import { cn } from "@/lib/utils";

const ROTATION = [
  "Why did the chip accord move markets today?",
  "Show me contradictions between sources on the trial",
  "Explain the rate decision with historical context",
  "What is the second-order impact on logistics?",
];

/** Animated typing placeholder + floating glass search field. */
export function AISearchBox({
  size = "lg",
  autoRotate = true,
  defaultValue = "",
  onSubmit,
  className,
}: {
  size?: "md" | "lg";
  autoRotate?: boolean;
  defaultValue?: string;
  onSubmit?: (q: string) => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState(defaultValue);
  const [typed, setTyped] = useState("");
  const idx = useRef(0);
  const pos = useRef(0);
  const dir = useRef<1 | -1>(1);

  useEffect(() => {
    if (!autoRotate) return;
    const t = setInterval(() => {
      const phrase = ROTATION[idx.current % ROTATION.length];
      pos.current += dir.current;
      if (pos.current > phrase.length) {
        dir.current = -1;
        pos.current = phrase.length;
      } else if (pos.current < 0) {
        dir.current = 1;
        pos.current = 0;
        idx.current += 1;
      }
      setTyped(phrase.slice(0, Math.max(0, pos.current)));
    }, 55);
    return () => clearInterval(t);
  }, [autoRotate]);

  const submit = () => {
    const q = value.trim();
    if (!q) return;
    if (onSubmit) onSubmit(q);
    else {
      setQuery(q);
      navigate({ to: "/app/search" });
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className="absolute -inset-px rounded-[26px] opacity-70 blur-lg"
        style={{ background: "var(--gradient-brand)" }}
        aria-hidden
      />
      <div
        className={cn(
          "relative flex items-center gap-3 rounded-[24px] border border-border bg-surface/90 backdrop-blur-2xl transition-shadow duration-500 focus-within:shadow-[var(--shadow-glow)]",
          size === "lg" ? "px-5 py-3.5" : "px-4 py-2.5",
        )}
      >
        <Sparkle className={cn("shrink-0 text-highlight", size === "lg" ? "h-5 w-5" : "h-4 w-4")} />
        <div className="relative min-w-0 flex-1">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            aria-label="Ask NEWSIQ anything"
            className={cn(
              "w-full bg-transparent outline-none placeholder:text-transparent",
              size === "lg" ? "text-base md:text-[17px]" : "text-sm",
            )}
          />
          {!value && (
            <span
              className={cn(
                "pointer-events-none absolute inset-y-0 left-0 flex items-center truncate text-muted-foreground",
                size === "lg" ? "text-base md:text-[17px]" : "text-sm",
              )}
            >
              {autoRotate ? typed : "Ask NEWSIQ anything"}
              <span className="ml-0.5 inline-block h-[1.1em] w-[2px] bg-highlight animate-caret" />
            </span>
          )}
        </div>
        <kbd className="hidden shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground sm:inline-flex">
          <Command className="h-3 w-3" />K
        </kbd>
        <button
          onClick={submit}
          aria-label="Run intelligence query"
          className={cn(
            "grid shrink-0 place-items-center rounded-full bg-brand text-primary-foreground transition-transform duration-300 hover:scale-105 ring-focus",
            size === "lg" ? "h-11 w-11" : "h-9 w-9",
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
