import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  GitCompare,
  Github,
  History,
  Radar,
  ScanEye,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import heroNetwork from "@/assets/hero-network.jpg";
import { AISearchBox } from "@/components/newsiq/ai-search-box";
import { Aurora, Particles } from "@/components/newsiq/aurora";
import { Btn, Chip, Panel } from "@/components/newsiq/kit";
import { Logo } from "@/components/newsiq/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEWSIQ — From Headlines to Intelligence" },
      {
        name: "description",
        content:
          "NEWSIQ is an AI news intelligence platform: multi-agent retrieval, credibility scoring, bias detection, historical context and impact analysis for every story.",
      },
      { property: "og:title", content: "NEWSIQ — From Headlines to Intelligence" },
      {
        property: "og:description",
        content:
          "Multi-agent AI that verifies, contextualises and compares the news instead of just listing it.",
      },
    ],
  }),
  component: Landing,
});

const AGENTS = [
  { icon: Radar, name: "Retrieval agent", body: "Sweeps 12,400 primary and secondary sources every minute." },
  { icon: ShieldCheck, name: "Verification agent", body: "Cross-checks each claim and scores source credibility." },
  { icon: ScanEye, name: "Bias agent", body: "Measures framing, omission and language lean across outlets." },
  { icon: History, name: "Context agent", body: "Rebuilds the timeline that made today's event possible." },
  { icon: GitCompare, name: "Comparison agent", body: "Places viewpoints side by side, with the disagreement highlighted." },
  { icon: Waypoints, name: "Impact agent", body: "Traces second-order effects across markets, policy and people." },
];

const STATS = [
  { value: "12.4K", label: "Sources monitored" },
  { value: "94%", label: "Median credibility" },
  { value: "7", label: "Reasoning agents" },
  { value: "1.8s", label: "Time to intelligence" },
];

const TESTIMONIALS = [
  {
    quote:
      "It replaced four tabs and a research analyst. The bias comparison alone changed how our desk briefs.",
    name: "Marta Ellis",
    role: "Head of Research, Northwind Capital",
  },
  {
    quote:
      "The context agent is uncanny. It tells me what happened eighteen months ago that made today inevitable.",
    name: "Daniel Okafor",
    role: "Policy Lead, Geneva Institute",
  },
  {
    quote: "Finally an interface that respects attention. Nothing on screen is decoration.",
    name: "Rin Takahashi",
    role: "Editor-in-Chief, Signal Weekly",
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <Aurora dense />
      <Particles />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#agents" className="transition-colors hover:text-foreground">Agents</a>
          <a href="#intelligence" className="transition-colors hover:text-foreground">Intelligence</a>
          <a href="#voices" className="transition-colors hover:text-foreground">Voices</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Btn variant="ghost" size="sm">Sign in</Btn>
          </Link>
          <Link to="/app/dashboard">
            <Btn size="sm">
              Launch NEWSIQ <ArrowRight className="h-4 w-4" />
            </Btn>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 pb-24 pt-16 text-center sm:px-8 sm:pt-24">
        <div className="animate-rise">
          <Chip className="mx-auto" icon={<span className="h-1.5 w-1.5 rounded-full bg-success" />}>
            Multi-agent intelligence · live
          </Chip>
        </div>

        <h1 className="mt-7 animate-rise text-balance text-5xl font-bold leading-[1.02] sm:text-6xl md:text-7xl" style={{ animationDelay: "60ms" }}>
          From Headlines to <span className="text-gradient">Intelligence.</span>
        </h1>

        <p
          className="mx-auto mt-6 max-w-2xl animate-rise text-pretty text-base leading-relaxed text-subtle sm:text-lg"
          style={{ animationDelay: "120ms" }}
        >
          NEWSIQ doesn't hand you articles. Seven reasoning agents retrieve, verify, de-bias,
          contextualise and compare every story — then answer the question you actually had.
        </p>

        <div className="mx-auto mt-10 max-w-2xl animate-rise" style={{ animationDelay: "180ms" }}>
          <AISearchBox />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["Verify a claim", "Compare viewpoints", "Explain the context", "Trace the impact"].map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </div>
        </div>

        <div
          className="relative mx-auto mt-16 max-w-4xl animate-rise overflow-hidden rounded-3xl border border-border"
          style={{ animationDelay: "240ms" }}
        >
          <img
            src={heroNetwork}
            alt="Global network of connected news sources analysed by NEWSIQ"
            width={1600}
            height={1008}
            className="w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 grid gap-4 p-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-left">
                <p className="font-display text-2xl font-bold sm:text-3xl">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-highlight">
            The agent mesh
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Six specialists reading the same event differently.
          </h2>
          <p className="mt-4 text-subtle">
            Each agent owns one epistemic job. Their disagreements are surfaced, not smoothed over.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a, i) => {
            const Icon = a.icon;
            return (
              <Panel key={a.name} interactive className="p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/40 text-highlight">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{a.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                <p className="mt-5 font-mono text-[11px] text-muted-foreground/70">
                  agent.0{i + 1}
                </p>
              </Panel>
            );
          })}
        </div>
      </section>

      {/* Intelligence strip */}
      <section id="intelligence" className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <Panel className="grid gap-10 overflow-hidden p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Every story arrives pre-interrogated.
            </h2>
            <p className="mt-4 text-subtle">
              Credibility score, bias vector, confidence interval, timeline, source comparison and
              impact chain — computed before you open it.
            </p>
            <Link to="/app/story/$storyId" params={{ storyId: "semiconductor-export-accord" }} className="mt-8 inline-block">
              <Btn>
                See a live intelligence report <ArrowRight className="h-4 w-4" />
              </Btn>
            </Link>
          </div>
          <div className="grid gap-3">
            {[
              { k: "Credibility", v: "94 / 100", d: "42 sources converged in 9 minutes" },
              { k: "Bias vector", v: "−8 · Center", d: "Framing variance low across outlets" },
              { k: "Confidence", v: "87%", d: "Two claims still awaiting a primary source" },
            ].map((row) => (
              <div
                key={row.k}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-border bg-background/40 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{row.k}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.d}</p>
                </div>
                <p className="font-display text-lg font-bold text-highlight">{row.v}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* Testimonials */}
      <section id="voices" className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <h2 className="text-3xl font-bold sm:text-4xl">Used by people who cannot be wrong.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Panel key={t.name} interactive className="flex flex-col p-6">
              <Brain className="h-5 w-5 text-violet" />
              <p className="mt-5 flex-1 text-[15px] leading-relaxed">“{t.quote}”</p>
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-5 pb-24 text-center sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border p-12">
          <div className="absolute inset-0 opacity-25 bg-brand" aria-hidden />
          <div className="relative">
            <h2 className="text-3xl font-bold sm:text-4xl">Stop reading news. Start querying it.</h2>
            <p className="mx-auto mt-4 max-w-lg text-subtle">
              Your first intelligence brief is ready in under two seconds.
            </p>
            <Link to="/auth" className="mt-8 inline-block">
              <Btn size="lg">
                Create your account <ArrowRight className="h-4 w-4" />
              </Btn>
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-8">
          <div className="min-w-0">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              From Headlines to Intelligence. Built for people who need to know why.
            </p>
          </div>
          <div className="flex items-end gap-5 text-sm text-muted-foreground">
            <a href="#agents" className="transition-colors hover:text-foreground">Agents</a>
            <Link to="/auth" className="transition-colors hover:text-foreground">Sign in</Link>
            <a href="#" aria-label="GitHub" className="transition-colors hover:text-foreground">
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
