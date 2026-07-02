import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://blyxvehtkkhmuqylashi.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJseXh2ZWh0a2tobXVxeWxhc2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMTk2NDcsImV4cCI6MjA5ODU5NTY0N30.xX49Lmi0vQc3JR6ZydKK3FP_A0wM0hpYlxiIzfj8VpU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
