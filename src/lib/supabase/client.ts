import { createBrowserClient } from "@supabase/ssr";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

type BrowserSupabase = ReturnType<typeof createBrowserClient>;

let cached: BrowserSupabase | null = null;

/** Returns null until NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are set. */
export function getBrowserSupabase(): BrowserSupabase | null {
  if (!isSupabaseConfigured()) return null;
  if (!cached) {
    cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return cached;
}
