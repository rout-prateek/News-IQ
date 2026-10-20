import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Aurora, Particles } from "@/components/newsiq/aurora";
import { Btn } from "@/components/newsiq/kit";
import { Logo } from "@/components/newsiq/logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to NEWSIQ — AI News Intelligence" },
      {
        name: "description",
        content:
          "Access your NEWSIQ intelligence workspace: verified stories, bias analysis and multi-agent research in one place.",
      },
      { property: "og:title", content: "Sign in to NEWSIQ" },
      {
        property: "og:description",
        content: "Access your multi-agent news intelligence workspace.",
      },
    ],
  }),
  component: Auth,
});

type Mode = "signin" | "register" | "forgot";

function Field({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 transition-colors focus-within:border-highlight/60">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <input
        {...props}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

function Auth() {
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;

    import("@/lib/supabase").then(({ supabase }) => {
      if (!active) return;

      // Check initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate({ to: "/app/dashboard" });
        }
      });
      // Listen for auth changes (like returning from OAuth)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          navigate({ to: "/app/dashboard" });
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [navigate]);

  const getAuthRedirectUrl = () => new URL("/auth", window.location.origin).toString();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const { supabase } = await import("@/lib/supabase");
      const normalizedEmail = email.trim();

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl(),
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          navigate({ to: "/app/dashboard" });
        } else {
          setErrorMsg("Account created! Please check your email to confirm.");
        }
      } else if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        if (!data.session) throw new Error("Sign-in did not create a session. Please try again.");
        navigate({ to: "/app/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: getAuthRedirectUrl(),
        });
        if (error) throw error;
        setErrorMsg("Reset link sent!");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getAuthRedirectUrl() },
      });
      if (error) throw error;
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Unable to start Google sign-in.");
      setLoading(false);
    }
  };

  const copy = {
    signin: { title: "Welcome back", sub: "Your agents kept working while you were away." },
    register: { title: "Create your workspace", sub: "Seven agents, one intelligence layer." },
    forgot: { title: "Reset access", sub: "We'll send a secure link to your inbox." },
  }[mode];

  return (
    <div className="relative grid min-h-screen bg-background lg:grid-cols-2">
      <Aurora dense />
      <Particles count={18} />

      {/* Narrative panel */}
      <div className="relative z-10 hidden flex-col justify-between border-r border-border p-12 lg:flex">
        <Logo />
        <div>
          <h2 className="text-4xl font-bold leading-tight">
            The news didn't change.
            <br />
            <span className="text-gradient">Your reading of it did.</span>
          </h2>
          <div className="mt-10 space-y-4">
            {[
              "94 median credibility across your feed this week",
              "12 contradictions surfaced before you read them",
              "3 narrative shifts flagged in your tracked topics",
            ].map((line) => (
              <div key={line} className="flex items-start gap-3 text-sm text-subtle">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-highlight" />
                {line}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">NEWSIQ · From Headlines to Intelligence</p>
      </div>

      {/* Form */}
      <div className="relative z-10 flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground ring-focus"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>

          <div className="glass rounded-3xl p-8 animate-rise">
            <div className="lg:hidden">
              <Logo />
            </div>
            <h1 className="mt-6 text-2xl font-bold lg:mt-0">{copy.title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{copy.sub}</p>

            {mode !== "forgot" && (
              <>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background/50 py-3 text-sm font-medium transition-colors hover:bg-card-hover ring-focus"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 1 1 0-12.4c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.65-.07-1.15-.16-1.65H12z"
                    />
                  </svg>
                  Continue with Google
                </button>
                <div className="my-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> or{" "}
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            <form onSubmit={submit} className="space-y-3">
              {errorMsg && (
                <div className="p-3 text-sm text-center rounded bg-red-500/10 text-red-500">
                  {errorMsg}
                </div>
              )}
              {mode === "register" && (
                <Field
                  icon={<User className="h-4 w-4" />}
                  placeholder="Full name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              )}
              <Field
                icon={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {mode !== "forgot" && (
                <Field
                  icon={<Lock className="h-4 w-4" />}
                  type="password"
                  placeholder="Password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}

              <Btn type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  "Waking your agents…"
                ) : (
                  <>
                    {mode === "signin"
                      ? "Sign in"
                      : mode === "register"
                        ? "Create account"
                        : "Send reset link"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Btn>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                onClick={() => {
                  setMode(mode === "register" ? "signin" : "register");
                  setErrorMsg("");
                }}
                className={cn(
                  "text-muted-foreground transition-colors hover:text-foreground ring-focus",
                )}
              >
                {mode === "register" ? "Have an account?" : "Create an account"}
              </button>
              <button
                onClick={() => setMode("forgot")}
                className="text-muted-foreground transition-colors hover:text-foreground ring-focus"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Protected by device-bound sessions. No tracking pixels, ever.
          </p>
        </div>
      </div>
    </div>
  );
}
