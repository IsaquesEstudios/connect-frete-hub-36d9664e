import { supabase } from "@/integrations/supabase/client";
import { repo } from "@/lib/data";
import { profileToUser } from "@/lib/data/supabaseRepository";
import type { User, UserType } from "@/lib/data";

let cachedUser: User | null = null;
let initialDone = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

async function loadProfile(authId: string): Promise<User | null> {
  // First try cache (populated by repo bootstrap)
  for (let i = 0; i < 30; i++) {
    const u = repo.getUser(authId);
    if (u) return u;
    await new Promise((r) => setTimeout(r, 100));
  }
  // Fallback: fetch directly
  const { data } = await supabase.from("profiles").select("*").eq("id", authId).maybeSingle();
  if (!data) return null;
  return profileToUser(data as Parameters<typeof profileToUser>[0]);
}

async function bootstrap() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    cachedUser = await loadProfile(data.session.user.id);
  }
  initialDone = true;
  notify();
  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session) cachedUser = await loadProfile(session.user.id);
    else cachedUser = null;
    notify();
  });
}

if (typeof window !== "undefined") void bootstrap();

export function currentUser(): User | null {
  return cachedUser;
}
export function isBootstrapped(): boolean {
  return initialDone;
}
export function onSessionChange(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export async function login(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Login falhou");
  const u = await loadProfile(data.user.id);
  if (!u) throw new Error("Perfil não encontrado. Contate o admin.");
  cachedUser = u;
  notify();
  return u;
}

export interface SignupInput {
  email: string;
  password: string;
  name: string;
  type: UserType;
  // documento
  documentoTipo?: "cnpj" | "cpf";
  cnpj?: string;
  cpf?: string;
  whatsapp?: string;
  // perfil
  fotoUrl?: string;
  // localização
  cidade?: string;
  estado?: string;
  // motorista
  placa?: string;
  veiculo?: string;
  tipoVeiculo?: string;
  rntrc?: string;
  carroceria?: string;
  // empresa
  nomeFantasia?: string;
  perfilEmpresa?: "transportador" | "embarcador" | "agenciador";
  siteRedeSocial?: string;
}

export async function signup(input: SignupInput): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Cadastro falhou");

  // Generate user_number
  const prefix = input.type === "empresa" ? "EMP" : input.type === "motorista" ? "MOT" : "ADM";
  const { data: existing } = await supabase
    .from("profiles")
    .select("user_number")
    .eq("type", input.type);
  const nums = (existing ?? []).map((r: { user_number: string }) =>
    parseInt(r.user_number.split("-")[1] || "0", 10),
  );
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  const user_number = `${prefix}-${String(next).padStart(4, "0")}`;

  if (!data.session) {
    throw new Error(
      "Conta criada, mas a confirmação de email está habilitada no Supabase. Desative em Authentication → Providers → Email → 'Confirm email' para poder entrar sem confirmar.",
    );
  }

  const { error: insErr } = await supabase.from("profiles").insert({
    id: data.user.id,
    user_number,
    type: input.type,
    name: input.name,
    cnpj: input.cnpj ?? null,
    cpf: input.cpf ?? null,
    whatsapp: input.whatsapp ?? null,
    foto_url: input.fotoUrl ?? null,
    cidade: input.cidade ?? null,
    estado: input.estado ?? null,
    placa: input.placa ?? null,
    veiculo: input.veiculo ?? null,
    tipo_veiculo: input.tipoVeiculo ?? null,
    rntrc: input.rntrc ?? null,
    carroceria: input.carroceria ?? null,
  });
  if (insErr) throw new Error(`Perfil: ${insErr.message}`);


  const u = await loadProfile(data.user.id);
  if (!u) throw new Error("Perfil criado mas não encontrado.");
  cachedUser = u;
  notify();
  return u;
}

export async function logout() {
  await supabase.auth.signOut();
  cachedUser = null;
  notify();
}

export function homeFor(user: User): string {
  if (user.type === "admin") return "/admin";
  if (user.type === "empresa") return "/empresa";
  return "/motorista";
}
