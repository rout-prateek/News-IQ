import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

/**
 * Reactive hook for Supabase auth state.
 * Returns the current session, user, display name, and sign-out function.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const isGuest = !session;

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return { session, user, loading, displayName, initials, isGuest, signOut };
}

/**
 * Derive a display name from the user object.
 * Priority: user_metadata.full_name > email prefix (capitalized) > "Guest"
 */
function getDisplayName(user: User | null): string {
  if (!user) return "Guest";
  const fullName = user.user_metadata?.full_name;
  if (fullName && typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }
  if (user.email) {
    const prefix = user.email.split("@")[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return "Guest";
}

/**
 * Get initials from a name string. Returns "G" for "Guest".
 */
function getInitials(name: string): string {
  if (!name || name === "Guest") return "G";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}
