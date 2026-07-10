// External Supabase client (blyx project).
// Bypasses the Lovable Cloud auto-generated client and points every data/auth
// call at the external Supabase project configured via EXT_SUPABASE_* secrets.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { EXT_SUPABASE_URL, EXT_SUPABASE_PUBLISHABLE_KEY } from "./external-config";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createExternalFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    }
    if (isNewSupabaseApiKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function createExternalClient() {
  return createClient(EXT_SUPABASE_URL, EXT_SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: createExternalFetch(EXT_SUPABASE_PUBLISHABLE_KEY) },
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "ext-sb-auth-token",
    },
  });
}

let _client: ReturnType<typeof createExternalClient> | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as SupabaseClient<any, "public", any>, {
  get(_t, prop, receiver) {
    if (!_client) _client = createExternalClient();
    return Reflect.get(_client, prop, receiver);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as unknown as SupabaseClient<any, "public", any>;
