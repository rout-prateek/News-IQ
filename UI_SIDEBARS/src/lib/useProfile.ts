import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      try {
        const res = await fetch("http://localhost:8000/api/v1/users/profile", {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
