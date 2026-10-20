import { createFileRoute } from "@tanstack/react-router";
import { Globe, KeyRound, Link2, Moon, Palette, ShieldCheck, User, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Btn, Chip, Panel, SectionHeading } from "@/components/newsiq/kit";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NEWSIQ" },
      {
        name: "description",
        content:
          "Manage your NEWSIQ profile, theme, language, alerts, privacy, security and connected accounts.",
      },
      { property: "og:title", content: "NEWSIQ Settings" },
      { property: "og:description", content: "Profile, theme, alerts, privacy and connected accounts." },
    ],
  }),
  component: Settings,
});

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "language", label: "Language", icon: Globe },
  { id: "alerts", label: "Notifications", icon: Moon },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
  { id: "security", label: "Security", icon: KeyRound },
  { id: "accounts", label: "Connected", icon: Link2 },
];

function Row({
  title,
  body,
  control,
}: {
  title: string;
  body: string;
  control: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border py-4 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
      {control}
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors ring-focus",
        on ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform",
          on ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

import { useProfile } from "@/lib/useProfile";
import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

function Settings() {
  const [active, setActive] = useState("profile");
  const { displayName: authDisplayName, isGuest, session } = useAuth();
  const [nameValue, setNameValue] = useState("");
  const [nameLoaded, setNameLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  // Load the display name from profile or auth when available
  useEffect(() => {
    if (!nameLoaded) {
      if (profile?.full_name) {
        setNameValue(profile.full_name);
        setNameLoaded(true);
      } else if (session?.user?.user_metadata?.full_name) {
        setNameValue(session.user.user_metadata.full_name);
        setNameLoaded(true);
      } else if (!isGuest && authDisplayName !== "Guest") {
        setNameValue(authDisplayName);
        setNameLoaded(true);
      }
    }
  }, [profile, session, authDisplayName, isGuest, nameLoaded]);

  const updateProfile = async () => {
    if (isGuest || !nameValue.trim()) return;
    setSaveStatus('saving');
    try {
      // Save to Supabase user_metadata
      const { supabase } = await import("@/lib/supabase");
      await supabase.auth.updateUser({
        data: { full_name: nameValue.trim() }
      });

      // Also save to backend
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        await fetch("http://localhost:8000/api/v1/users/profile", {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentSession.access_token}`
          },
          body: JSON.stringify({ full_name: nameValue.trim() })
        });
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="space-y-1">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ring-focus",
                active === s.id
                  ? "bg-card-hover text-foreground"
                  : "text-muted-foreground hover:bg-card-hover hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </aside>

      <div className="min-w-0 space-y-6">
        <SectionHeading eyebrow="Workspace" title="Settings" />

        <Panel className="p-6">
          <p className="text-sm font-semibold">Profile</p>
          <div className="mt-2">
            <Row 
              title="Display name" 
              body="Shown on shared reports" 
              control={
                <div className="flex items-center gap-2">
                  <input 
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onBlur={updateProfile}
                    placeholder={isGuest ? "Sign in to set" : "Your name"}
                    disabled={isGuest}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-[12.5px] font-medium text-foreground transition-all duration-300 ring-focus hover:border-highlight/40 outline-none w-36 text-center",
                      isGuest && "opacity-50 cursor-not-allowed"
                    )}
                  />
                  {saveStatus === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  {saveStatus === 'saved' && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                </div>
              } 
            />
            <Row title="Role" body="Tunes the depth of agent explanations" control={<Chip>Analyst</Chip>} />
            <Row title="Default briefing time" body="When your digest is generated" control={<Chip>07:00</Chip>} />
          </div>
        </Panel>

        <Panel className="p-6">
          <p className="text-sm font-semibold">Appearance & language</p>
          <div className="mt-2">
            <Row
              title="Theme"
              body="Dark is the default; light is fully supported"
              control={
                <div className="flex gap-2">
                  <Chip active>Dark</Chip>
                  <Chip>Light</Chip>
                </div>
              }
            />
            <Row title="Reduced motion" body="Disable ambient and transition animation" control={<Toggle />} />
            <Row title="Language" body="Interface and summary language" control={<Chip>English (US)</Chip>} />
          </div>
        </Panel>

        <Panel className="p-6">
          <p className="text-sm font-semibold">Notifications</p>
          <div className="mt-2">
            <Row title="Breaking news" body="Only above 85 credibility" control={<Toggle defaultOn />} />
            <Row title="Topic alerts" body="Tracked topics only" control={<Toggle defaultOn />} />
            <Row title="Daily digest" body="One brief each morning" control={<Toggle defaultOn />} />
            <Row title="Agent recommendations" body="Blind-spot suggestions" control={<Toggle />} />
          </div>
        </Panel>

        <Panel className="p-6">
          <p className="text-sm font-semibold">Privacy & security</p>
          <div className="mt-2">
            <Row title="Personalisation data" body="Used only to rank your feed" control={<Toggle defaultOn />} />
            <Row title="Two-factor authentication" body="Authenticator app enrolled" control={<Toggle defaultOn />} />
            <Row title="Active sessions" body="3 devices signed in" control={<Btn variant="outline" size="sm">Review</Btn>} />
          </div>
        </Panel>

        <Panel className="p-6">
          <p className="text-sm font-semibold">Account</p>
          <div className="mt-2">
            <Row 
              title="Sign Out" 
              body="Sign out of your current session on this device." 
              control={
                <Btn 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    const { supabase } = await import("@/lib/supabase");
                    await supabase.auth.signOut();
                    window.location.href = "/auth";
                  }}
                >
                  Sign Out
                </Btn>
              } 
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
