import { createClient } from "@supabase/supabase-js";

function requireEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const fallbacks = {
    NEXT_PUBLIC_SUPABASE_URL: "SUPABASE_URL",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "SUPABASE_ANON_KEY",
    SUPABASE_SERVICE_ROLE_KEY: "SUPABASE_SERVICE_ROLE_KEY",
  } satisfies Record<typeof name, string>;

  const value = process.env[name] ?? process.env[fallbacks[name]];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// Server-side client — uses service role key, never exposed to the browser.
export function createServerClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}

// Browser-safe client — uses anon key, respects RLS.
export function createBrowserClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
}
