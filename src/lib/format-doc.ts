export type DocTipo = "cpf" | "cnpj";

export function formatDoc(value: string, tipo: DocTipo): string {
  const digits = value.replace(/\D/g, "").slice(0, tipo === "cpf" ? 11 : 14);
  if (tipo === "cpf") {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

export function docPlaceholder(tipo: DocTipo): string {
  return tipo === "cpf" ? "000.000.000-00" : "00.000.000/0001-00";
}

export function docDigitsValid(value: string, tipo: DocTipo): boolean {
  const digits = value.replace(/\D/g, "");
  return tipo === "cpf" ? digits.length === 11 : digits.length === 14;
}
