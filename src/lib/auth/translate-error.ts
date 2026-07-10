// Traduz mensagens de erro do Supabase Auth para PT-BR.

const MAP: { pattern: RegExp; message: string }[] = [
  [/invalid login credentials/i, "Email ou senha incorretos."],
  [/email not confirmed/i, "Email ainda não confirmado."],
  [/user already registered|already been registered/i, "Este email já está cadastrado."],
  [/password should be at least (\d+)/i, "A senha deve ter pelo menos $1 caracteres."],
  [/rate limit|too many requests/i, "Muitas tentativas. Aguarde alguns segundos e tente novamente."],
  [/user not found/i, "Usuário não encontrado."],
  [/invalid email/i, "Email inválido."],
  [/network|failed to fetch/i, "Falha de conexão. Verifique sua internet."],
  [/signups? (are )?disabled/i, "Cadastro desativado no momento."],
  [/weak password/i, "Senha muito fraca."],
  [/token has expired|invalid token/i, "Link expirado ou inválido. Solicite um novo."],
  [/same_password|new password should be different/i, "A nova senha deve ser diferente da anterior."],
  [/user banned|banned/i, "Esta conta está desativada. Contate o administrador."],
  [/unable to validate email address.*invalid format/i, "Email inválido. Verifique o formato (ex: nome@dominio.com)."],
  [/email address .* is invalid/i, "Email inválido. Verifique o formato (ex: nome@dominio.com)."],
  [/email address .* cannot be used/i, "Este email não pode ser usado. Tente outro."],
  [/duplicate key value|already exists/i, "Este registro já existe."],
  [/permission denied|not authorized|forbidden/i, "Sem permissão para executar esta ação."],
  [/violates row-level security/i, "Sem permissão para executar esta ação."],
  [/violates.*not-null|null value in column/i, "Preencha todos os campos obrigatórios."],
  [/violates unique constraint/i, "Este valor já está em uso."],
  [/jwt|token/i, "Sessão expirada. Faça login novamente."],
].map(([p, m]) => ({ pattern: p as RegExp, message: m as string }));

export function translateAuthError(err: unknown): string {
  let raw = "";
  if (err instanceof Error) raw = err.message;
  else if (typeof err === "string") raw = err;
  else if (err && typeof err === "object") {
    const o = err as { message?: unknown; error_description?: unknown; msg?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    raw = String(o.message ?? o.error_description ?? o.msg ?? o.details ?? o.hint ?? o.code ?? "");
  }
  for (const { pattern, message } of MAP) {
    const m = raw.match(pattern);
    if (m) return message.replace(/\$(\d)/g, (_, i) => m[Number(i)] ?? "");
  }
  return raw || "Ocorreu um erro. Tente novamente.";
}
