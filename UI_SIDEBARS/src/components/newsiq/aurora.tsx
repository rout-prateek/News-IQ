import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Deterministic pseudo-random so SSR and client agree. */
function seeded(i: number, salt: number) {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function Aurora({ className, dense = false }: { className?: string; dense?: boolean }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="absolute inset-0 grid-lines opacity-60" />
      <div
        className="absolute -left-40 -top-56 h-[36rem] w-[36rem] rounded-full blur-[120px] animate-aurora"
        style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 65%)", opacity: 0.55 }}
      />
      <div
        className="absolute -right-40 -top-24 h-[32rem] w-[32rem] rounded-full blur-[130px] animate-aurora"
        style={{
          background: "radial-gradient(circle, var(--color-violet) 0%, transparent 65%)",
          opacity: 0.5,
          animationDelay: "-6s",
        }}
      />
      {dense && (
        <div
          className="absolute left-1/3 top-1/2 h-[34rem] w-[34rem] rounded-full blur-[140px] animate-aurora"
          style={{
            background: "radial-gradient(circle, var(--color-highlight) 0%, transparent 70%)",
            opacity: 0.28,
            animationDelay: "-11s",
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, transparent 30%, var(--color-background) 78%)",
        }}
      />
    </div>
  );
}

export function Particles({ count = 26, className }: { count?: number; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.round(seeded(i, 1) * 1000) / 10;
        const top = Math.round(seeded(i, 2) * 1000) / 10;
        const size = Math.round((1.5 + seeded(i, 3) * 3.5) * 10) / 10;
        const delay = Math.round(seeded(i, 4) * 90) / 10;
        const duration = Math.round((7 + seeded(i, 5) * 8) * 10) / 10;
        return (
          <span
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              background: i % 3 === 0 ? "var(--color-highlight)" : "var(--color-primary)",
              boxShadow: "0 0 12px currentColor",
              animationDelay: `-${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}
