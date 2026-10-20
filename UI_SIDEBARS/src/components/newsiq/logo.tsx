import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand shadow-[0_10px_30px_-12px_var(--color-primary)]">
        <span className="absolute inset-0 rounded-xl opacity-60 blur-md bg-brand" aria-hidden />
        <svg viewBox="0 0 24 24" className="relative h-4 w-4" fill="none" aria-hidden>
          <path
            d="M5 18V6l14 12V6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-foreground"
          />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[17px] font-bold tracking-tight">
          NEWS<span className="text-gradient">IQ</span>
        </span>
      )}
    </span>
  );
}
