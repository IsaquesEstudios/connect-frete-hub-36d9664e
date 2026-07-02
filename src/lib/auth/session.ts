import { repo } from "@/lib/data";
import type { User } from "@/lib/data";

const KEY = "conectafrete:session";

const listeners = new Set<() => void>();

export function currentUser(): User | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(KEY);
  if (!id) return null;
  return repo.getUser(id) ?? null;
}

export function login(numberOrId: string, password: string): User {
  const id = numberOrId.trim().toUpperCase();
  const user = repo.getUser(id);
  if (!user) throw new Error("Número de usuário não encontrado");
  if (!password.trim()) throw new Error("Informe uma senha");
  if (user.password && user.password !== password) throw new Error("Senha incorreta");
  window.localStorage.setItem(KEY, user.id);
  listeners.forEach((l) => l());
  return user;
}

export function logout() {
  window.localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function onSessionChange(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function homeFor(user: User): string {
  if (user.type === "admin") return "/admin";
  if (user.type === "empresa") return "/empresa";
  return "/motorista";
}
