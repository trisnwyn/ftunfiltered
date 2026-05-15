import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Browser Supabase client.
 *
 * Returns a single, module-scoped instance. Calling `createClient()` repeatedly
 * (e.g. from a React render) returns the same object — so consumers that
 * `useEffect`-depend on the client or `auth` won't re-fire on every render.
 */
export function createClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  cachedClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return cachedClient;
}
