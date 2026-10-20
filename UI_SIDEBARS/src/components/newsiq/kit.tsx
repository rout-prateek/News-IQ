import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Button --------------------------------- */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "brand" | "glass" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

const btnBase =
  "inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 ring-focus disabled:pointer-events-none disabled:opacity-50";

const btnVariant: Record<NonNullable<BtnProps["variant"]>, string> = {
  brand:
    "bg-brand text-primary-foreground shadow-[0_18px_45px_-20px_var(--color-primary)] hover:brightness-115 hover:-translate-y-0.5 active:translate-y-0",
  glass:
    "glass text-foreground hover:bg-card-hover hover:-translate-y-0.5",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-card-hover",
  outline: "border border-border text-foreground hover:border-highlight/50 hover:bg-card-hover",
};

const btnSize: Record<NonNullable<BtnProps["size"]>, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[15px]",
};

export function Btn({ variant = "brand", size = "md", className, ...props }: BtnProps) {
  return <button className={cn(btnBase, btnVariant[variant], btnSize[size], className)} {...props} />;
}

/* ---------------------------------- Chip ----------------------------------- */

export function Chip({
  children,
  active,
  onClick,
  className,
  icon,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
}) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all duration-300 ring-focus",
        active
          ? "border-transparent bg-brand text-primary-foreground shadow-[0_12px_30px_-16px_var(--color-primary)]"
          : "border-border bg-card/60 text-muted-foreground hover:border-highlight/40 hover:text-foreground",
        className,
      )}
    >
      {icon}
      {children}
    </Comp>
  );
}

/* ---------------------------------- Card ----------------------------------- */

export function Panel({
  children,
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/70 backdrop-blur-xl",
        interactive && "card-lift",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-highlight">
            {eyebrow}
          </p>
        )}
        <h2 className="truncate text-xl font-semibold sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* --------------------------------- Meters ---------------------------------- */

function toneFor(score: number) {
  if (score >= 88) return "var(--color-success)";
  if (score >= 72) return "var(--color-highlight)";
  if (score >= 55) return "var(--color-warning)";
  return "var(--color-destructive)";
}

export function CredibilityMeter({
  score,
  label = "Credibility",
  size = 96,
  reason,
}: {
  score: number;
  label?: string;
  size?: number;
  reason?: string;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const tone = toneFor(score);
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * score) / 100}
            style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-lg font-bold">{score}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-normal">
          {reason ? reason : (score >= 88 ? "Multi-source verified. High reporting consistency." : score >= 72 ? "Mostly corroborated. Minor details await verification." : "Needs review. Limited primary source citation.")}
        </p>
      </div>
    </div>
  );
}

export function BiasMeter({ value }: { value: number }) {
  const normalizedValue = Math.abs(value) <= 1.0 ? value * 100 : value;
  const pct = ((normalizedValue + 100) / 200) * 100;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Left</span>
        <span className="font-medium text-foreground">
          {Math.abs(normalizedValue) < 10 ? "Center" : normalizedValue < 0 ? "Leans left" : "Leans right"}
        </span>
        <span>Right</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-muted">
        <div
          className="absolute inset-0 rounded-full opacity-45"
          style={{
            background:
              "linear-gradient(90deg, var(--color-highlight), var(--color-muted-foreground) 50%, var(--color-warning))",
          }}
        />
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow-lg"
          style={{ left: `${pct}%`, transition: "left 1s cubic-bezier(.22,1,.36,1)" }}
        />
      </div>
    </div>
  );
}

export function ConfidenceBar({ label, value, tone = "primary" }: { label: string; value: number; tone?: "primary" | "violet" | "highlight" | "success" | "warning" }) {
  const colors: Record<string, string> = {
    primary: "var(--color-primary)",
    violet: "var(--color-violet)",
    highlight: "var(--color-highlight)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
  };
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: colors[tone],
            transition: "width 1s cubic-bezier(.22,1,.36,1)",
          }}
        />
      </div>
    </div>
  );
}

export function ImpactBadge({ impact }: { impact: string }) {
  const tone =
    impact === "Critical"
      ? "text-destructive border-destructive/40 bg-destructive/10"
      : impact === "High"
        ? "text-warning border-warning/40 bg-warning/10"
        : impact === "Moderate"
          ? "text-highlight border-highlight/40 bg-highlight/10"
          : "text-success border-success/40 bg-success/10";
  return (
    <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", tone)}>
      {impact} impact
    </span>
  );
}

/* --------------------------- AI thinking + loading -------------------------- */

export function AIThinking({ label = "Reasoning across 42 sources" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span className="relative grid h-7 w-7 place-items-center">
        <span className="absolute inset-0 rounded-full border border-highlight/30" />
        <span className="absolute inset-0 rounded-full border-t-2 border-highlight animate-orbit" style={{ animationDuration: "2.2s" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-highlight animate-pulse-soft" />
      </span>
      <span
        className="bg-clip-text text-transparent animate-shimmer"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--color-muted-foreground) 0%, var(--color-foreground) 50%, var(--color-muted-foreground) 100%)",
          backgroundSize: "200% 100%",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-3 rounded-full animate-shimmer", className)}
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--color-muted) 0%, var(--color-card-hover) 50%, var(--color-muted) 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card/70 text-highlight">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
