// Fetches Brazilian municipalities from IBGE and caches in memory.
// Endpoint returns ~5570 items, each with municipio name and UF.

export type Municipio = { nome: string; uf: string; ufNome: string };

let cache: Municipio[] | null = null;
let inflight: Promise<Municipio[]> | null = null;

interface IBGEItem {
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: { sigla?: string; nome?: string };
    };
  };
  "regiao-imediata"?: {
    "regiao-intermediaria"?: {
      UF?: { sigla?: string; nome?: string };
    };
  };
}

export async function loadMunicipios(): Promise<Municipio[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome",
    );
    const data = (await res.json()) as IBGEItem[];
    const parsed: Municipio[] = data.map((m) => {
      const uf =
        m.microrregiao?.mesorregiao?.UF ??
        m["regiao-imediata"]?.["regiao-intermediaria"]?.UF ??
        {};
      return {
        nome: m.nome,
        uf: uf.sigla ?? "",
        ufNome: uf.nome ?? "",
      };
    });
    cache = parsed;
    return parsed;
  })();
  return inflight;
}

export function searchMunicipiosByName(all: Municipio[], q: string, limit = 50): string[] {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const qn = norm(q.trim());
  if (!qn) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of all) {
    if (out.length >= limit) break;
    if (seen.has(m.nome)) continue;
    if (norm(m.nome).startsWith(qn)) {
      seen.add(m.nome);
      out.push(m.nome);
    }
  }
  return out;
}

export function statesForCityName(all: Municipio[], cityName: string): Municipio[] {
  return all.filter((m) => m.nome === cityName);
}

export const TIPOS_VEICULO: { grupo: string; opcoes: string[] }[] = [
  {
    grupo: "Veículos pesados",
    opcoes: ["Bitrem", "Carreta Comum", "Carreta LS", "Rodotrem", "Vanderléia", "Outros"],
  },
  { grupo: "Veículos médios", opcoes: ["Bitruck", "Truck", "Outros"] },
  { grupo: "Veículos leves", opcoes: ["3/4", "Toco", "VLC", "Outros"] },
];

export const CARROCERIAS: { grupo: string; opcoes: string[] }[] = [
  {
    grupo: "Carroceria fechada",
    opcoes: ["Caçamba", "Grade Baixa", "Graneleiro", "Prancha", "Outros"],
  },
  { grupo: "Carroceria aberta", opcoes: ["Baú Comum", "Baú Frigorífico", "Sider", "Outros"] },
  {
    grupo: "Carroceria especial",
    opcoes: [
      "Apenas Cavalo",
      "Bug Porta Container",
      "Cavaqueira",
      "Cegonheiro",
      "Gaiola",
      "Munk",
      "Silo",
      "Tanque",
      "Outros",
    ],
  },
];
