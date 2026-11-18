import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./client";

/**
 * Server-side Supabase client bound to the visitor's auth cookies.
 * Returns null when Supabase is not configured yet, so every route can fall
 * back to demo mode instead of crashing.
 */
export async function getServerSupabase() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* Called from a Server Component — middleware refreshes the session instead. */
        }
      },
    },
  });
}
