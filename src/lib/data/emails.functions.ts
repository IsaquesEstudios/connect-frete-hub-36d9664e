import { createServerFn } from "@tanstack/react-start";
import { EXT_SUPABASE_URL } from "@/integrations/supabase/external-config";

// Fetch id -> email map from the external Supabase (blyx) Auth admin API.
// The profiles table there does not carry an `email` column, so reports pull
// it directly from auth.users via the service-role admin endpoint.
export const getExternalUserEmails = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<string, string>> => {
    const key = process.env.EXT_SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return {};
    const map: Record<string, string> = {};
    for (let page = 1; page <= 20; page++) {
      const res = await fetch(
        `${EXT_SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } },
      );
      if (!res.ok) break;
      const body = (await res.json()) as { users?: Array<{ id: string; email?: string | null }> };
      const users = body.users ?? [];
      if (users.length === 0) break;
      for (const u of users) if (u.email) map[u.id] = u.email;
      if (users.length < 200) break;
    }
    return map;
  },
);
