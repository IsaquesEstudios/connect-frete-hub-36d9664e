// Wrapper around the auto-generated Supabase client that loosens table typing
// so that queries against tables not present in the generated Database type
// (this project uses a pre-existing schema) still typecheck.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as generatedSupabase } from "./client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = generatedSupabase as unknown as SupabaseClient<any, "public", any>;
