// Máscara de peso em kg com separador de milhar pt-BR.

export function formatKg(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 7);
  if (!digits) return "";
  return `${Number(digits).toLocaleString("pt-BR")} kg`;
}

export function kgDigits(value: string): string {
  return value.replace(/\D/g, "");
}
