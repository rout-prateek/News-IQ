import heroNetwork from "@/assets/hero-network.jpg";
import storyChips from "@/assets/story-chips.jpg";

export type Story = {
  id: string;
  title: string;
  dek: string;
  topic: string;
  region: string;
  minutes: number;
  published: string;
  credibility: number;
  bias: number; // -100 left .. 100 right
  consensus: number;
  impact: "Low" | "Moderate" | "High" | "Critical";
  sources: number;
  image: string;
  tags: string[];
};

export const STORIES: Story[] = [
  {
    id: "semiconductor-export-accord",
    title: "Global chip accord reshapes the advanced semiconductor supply chain",
    dek: "Eleven governments agreed on a shared export framework for sub-3nm tooling, ending eighteen months of fragmented controls.",
    topic: "Technology",
    region: "Global",
    minutes: 6,
    published: "12 min ago",
    credibility: 94,
    bias: -8,
    consensus: 87,
    impact: "Critical",
    sources: 42,
    image: storyChips,
    tags: ["Semiconductors", "Trade Policy", "Supply Chain"],
  },
  {
    id: "energy-grid-ai",
    title: "AI load forecasting cuts grid balancing costs across four markets",
    dek: "Operators report a 19% drop in intraday balancing spend after deploying probabilistic demand models.",
    topic: "Energy",
    region: "Europe",
    minutes: 4,
    published: "38 min ago",
    credibility: 91,
    bias: 4,
    consensus: 78,
    impact: "High",
    sources: 27,
    image: heroNetwork,
    tags: ["Grid", "Machine Learning", "Utilities"],
  },
  {
    id: "central-bank-signal",
    title: "Central bank signals a slower path as core inflation cools again",
    dek: "Forward guidance shifted for the first time since spring, with two dissents recorded in the minutes.",
    topic: "Markets",
    region: "North America",
    minutes: 5,
    published: "1 hr ago",
    credibility: 88,
    bias: 12,
    consensus: 64,
    impact: "High",
    sources: 51,
    image: heroNetwork,
    tags: ["Monetary Policy", "Inflation", "Rates"],
  },
  {
    id: "clinical-trial-readout",
    title: "Phase III readout redefines the standard of care for early detection",
    dek: "The trial met both primary endpoints, though the effect size narrowed in the pre-specified subgroup.",
    topic: "Health",
    region: "Global",
    minutes: 7,
    published: "2 hr ago",
    credibility: 96,
    bias: -2,
    consensus: 92,
    impact: "Moderate",
    sources: 18,
    image: storyChips,
    tags: ["Biotech", "Clinical Trials", "Oncology"],
  },
  {
    id: "orbital-debris-treaty",
    title: "Orbital debris framework gains the signatures it needed to bind",
    dek: "Operators of more than 60% of active satellites are now covered by end-of-life disposal rules.",
    topic: "Science",
    region: "Global",
    minutes: 5,
    published: "3 hr ago",
    credibility: 85,
    bias: -14,
    consensus: 71,
    impact: "Moderate",
    sources: 23,
    image: heroNetwork,
    tags: ["Space", "Regulation", "Sustainability"],
  },
  {
    id: "labor-automation-report",
    title: "Automation report finds task displacement, not job displacement",
    dek: "Across 900 occupations, the study measures reallocation of tasks rather than net headcount decline.",
    topic: "Economy",
    region: "Asia",
    minutes: 8,
    published: "5 hr ago",
    credibility: 79,
    bias: 22,
    consensus: 58,
    impact: "High",
    sources: 34,
    image: storyChips,
    tags: ["Labor", "Automation", "Research"],
  },
];

export const getStory = (id: string) => STORIES.find((s) => s.id === id) ?? STORIES[0];

export const TOPICS = [
  "Technology",
  "Markets",
  "Geopolitics",
  "Energy",
  "Health",
  "Science",
  "Economy",
  "Climate",
];

export const TRENDING_QUESTIONS = [
  "What changed in the chip export framework this week?",
  "Compare how three regions covered the rate decision",
  "Which claims about the trial readout are unverified?",
  "Summarise the energy story with historical context",
  "What is the second-order impact on logistics firms?",
];

export const SOURCE_COMPARISON = [
  { source: "Reuters Wire", lean: "Center", credibility: 96, take: "Framework binds tooling exports; enforcement begins in Q1." },
  { source: "The Ledger", lean: "Center-left", credibility: 88, take: "Emphasises worker retraining commitments attached to the accord." },
  { source: "Market Signal", lean: "Center-right", credibility: 84, take: "Frames the accord as a cost burden on mid-tier equipment makers." },
  { source: "Pacific Daily", lean: "Center", credibility: 79, take: "Focuses on regional fabrication capacity and timeline risk." },
];

export const TIMELINE = [
  { date: "Mar 2024", label: "First unilateral tooling restrictions announced", tone: "neutral" },
  { date: "Sep 2024", label: "Three-nation alignment talks begin in Geneva", tone: "neutral" },
  { date: "Feb 2025", label: "Draft framework leaks; industry pushback intensifies", tone: "warning" },
  { date: "Today", label: "Eleven governments sign the shared export accord", tone: "positive" },
];

export const ENTITIES = [
  { name: "Advanced Lithography Consortium", type: "Organization", mentions: 214 },
  { name: "Geneva Trade Council", type: "Institution", mentions: 168 },
  { name: "Sub-3nm Tooling", type: "Technology", mentions: 143 },
  { name: "Q1 Enforcement Window", type: "Event", mentions: 96 },
];

export const BOOKMARK_COLLECTIONS = [
  { name: "Semiconductor watch", count: 14, progress: 62, color: "primary" },
  { name: "Macro & rates", count: 9, progress: 38, color: "violet" },
  { name: "Health research", count: 21, progress: 84, color: "highlight" },
  { name: "Read later", count: 6, progress: 12, color: "success" },
];

export const NOTIFICATIONS = [
  {
    kind: "Breaking",
    title: "Chip accord signed by eleven governments",
    body: "Credibility 94 · 42 sources converged within 9 minutes.",
    time: "12m",
    tone: "danger" as const,
  },
  {
    kind: "Topic alert",
    title: "New primary source on the Phase III readout",
    body: "The full protocol was published; two earlier claims are now verified.",
    time: "1h",
    tone: "primary" as const,
  },
  {
    kind: "Daily digest",
    title: "Your morning intelligence brief is ready",
    body: "6 stories, 2 contradictions flagged, 1 narrative shift detected.",
    time: "6h",
    tone: "highlight" as const,
  },
  {
    kind: "AI recommendation",
    title: "You may be missing the logistics angle",
    body: "Three sources you don't follow lead with port capacity effects.",
    time: "9h",
    tone: "violet" as const,
  },
];

export const READING_BY_DAY = [
  { day: "Mon", stories: 12, minutes: 34 },
  { day: "Tue", stories: 18, minutes: 51 },
  { day: "Wed", stories: 9, minutes: 22 },
  { day: "Thu", stories: 22, minutes: 63 },
  { day: "Fri", stories: 16, minutes: 44 },
  { day: "Sat", stories: 7, minutes: 19 },
  { day: "Sun", stories: 11, minutes: 28 },
];

export const TOPIC_DISTRIBUTION = [
  { name: "Technology", value: 34 },
  { name: "Markets", value: 24 },
  { name: "Science", value: 18 },
  { name: "Energy", value: 14 },
  { name: "Health", value: 10 },
];

export const CREDIBILITY_TREND = [
  { week: "W1", score: 78, bias: 22 },
  { week: "W2", score: 81, bias: 19 },
  { week: "W3", score: 84, bias: 16 },
  { week: "W4", score: 83, bias: 14 },
  { week: "W5", score: 88, bias: 11 },
  { week: "W6", score: 91, bias: 9 },
];

/**
 * URL-safe Base64 encoding/decoding utilities for article routing.
 * Extracts navigation logic to avoid inconsistency between Dashboard, Feed, and Story details.
 */
export function encodeArticleId(storyObj: any): string {
  const jsonStr = JSON.stringify(storyObj);
  return btoa(encodeURIComponent(jsonStr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeArticleId(encodedId: string): any {
  let base64 = encodedId.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return JSON.parse(decodeURIComponent(atob(base64)));
}
