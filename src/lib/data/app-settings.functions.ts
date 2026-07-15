import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { EXT_SUPABASE_URL } from "@/integrations/supabase/external-config";

const DEFAULT_MOTORISTAS = "https://chat.whatsapp.com/";
const DEFAULT_EMPRESAS = "https://chat.whatsapp.com/";

function serviceHeaders(serviceKey: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: serviceKey };
  if (!serviceKey.startsWith("sb_secret_")) headers.Authorization = `Bearer ${serviceKey}`;
  return headers;
}

async function fetchSetting(serviceKey: string, key: string): Promise<string | null> {
  const res = await fetch(
    `${EXT_SUPABASE_URL}/rest/v1/app_settings?key=eq.${encodeURIComponent(key)}&select=value`,
    { headers: serviceHeaders(serviceKey) },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ value?: string }>;
  return rows[0]?.value ?? null;
}

export const getWhatsappLinks = createServerFn({ method: "GET" }).handler(async () => {
  const serviceKey = process.env.EXT_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return { motoristas: DEFAULT_MOTORISTAS, empresas: DEFAULT_EMPRESAS };
  }
  const [motoristas, empresas] = await Promise.all([
    fetchSetting(serviceKey, "whatsapp_motoristas"),
    fetchSetting(serviceKey, "whatsapp_empresas"),
  ]);
  return {
    motoristas: motoristas ?? DEFAULT_MOTORISTAS,
    empresas: empresas ?? DEFAULT_EMPRESAS,
  };
});

export const updateWhatsappLinks = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        motoristas: z.string().url("Link inválido para motoristas"),
        empresas: z.string().url("Link inválido para empresas"),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const serviceKey = process.env.EXT_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error("Configuração do servidor ausente.");

    const request = getRequest();
    const authHeader = request?.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) throw new Error("Sessão inválida. Faça login novamente.");

    const userRes = await fetch(`${EXT_SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) throw new Error("Sessão inválida.");
    const authUser = (await userRes.json()) as { id?: string };
    if (!authUser.id) throw new Error("Sessão inválida.");

    const profRes = await fetch(
      `${EXT_SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(authUser.id)}&select=type`,
      { headers: serviceHeaders(serviceKey) },
    );
    const profs = (await profRes.json()) as Array<{ type?: string }>;
    if (profs[0]?.type !== "admin") throw new Error("Apenas administradores podem alterar essas configurações.");

    const payload = [
      { key: "whatsapp_motoristas", value: data.motoristas },
      { key: "whatsapp_empresas", value: data.empresas },
    ];

    const upsertRes = await fetch(`${EXT_SUPABASE_URL}/rest/v1/app_settings?on_conflict=key`, {
      method: "POST",
      headers: {
        ...serviceHeaders(serviceKey),
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(payload),
    });
    if (!upsertRes.ok) {
      const text = await upsertRes.text().catch(() => "");
      throw new Error(`Não foi possível salvar. ${text}`.trim());
    }
    return { ok: true as const };
  });
