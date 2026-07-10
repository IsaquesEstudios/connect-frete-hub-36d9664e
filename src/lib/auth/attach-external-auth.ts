import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/loose-client";

// Attaches the EXTERNAL Supabase (blyx) bearer token to server function calls.
// Replaces the auto-generated attachSupabaseAuth which reads the Lovable Cloud
// session — this project is 100% on the external database.
export const attachExternalSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
