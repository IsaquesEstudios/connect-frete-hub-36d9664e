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

export function listUFs(all: Municipio[]): { uf: string; nome: string }[] {
  const map = new Map<string, string>();
  for (const m of all) {
    if (m.uf && !map.has(m.uf)) map.set(m.uf, m.ufNome);
  }
  return Array.from(map.entries())
    .map(([uf, nome]) => ({ uf, nome }))
    .sort((a, b) => a.uf.localeCompare(b.uf));
}

export function citiesByUF(all: Municipio[], uf: string): string[] {
  return all
    .filter((m) => m.uf === uf)
    .map((m) => m.nome)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export const TIPOS_VEICULO: { grupo: string; opcoes: string[] }[] = [
  {
    grupo: "Veículos pesados",
    opcoes: [
      "Bitrem 7 eixos",
      "Bitrem 9 eixos",
      "Carreta",
      "Carreta 4º eixo",
      "Carreta LS",
      "Rodotrem",
      "Vanderléia",
    ],
  },
  { grupo: "Veículos médios", opcoes: ["Bitruck", "Truck"] },
  { grupo: "Veículos leves", opcoes: ["3/4", "Fiorino", "Toco", "VLC"] },
];

export const CARROCERIAS: { grupo: string; opcoes: string[] }[] = [
  {
    grupo: "Baús",
    opcoes: ["Baú Seco", "Baú Container", "Baú Frigorífico", "Baú Refrigerado"],
  },
  {
    grupo: "Abertas",
    opcoes: ["Sider", "Caçamba", "Grade Baixa", "Graneleiro alto", "Plataforma", "Prancha"],
  },
  {
    grupo: "Especiais",
    opcoes: [
      "Apenas Cavalo",
      "Bug Porta Container",
      "Cavaqueira",
      "Cegonheiro",
      "Gaiola",
      "Hopper",
      "Munck",
      "Silo",
      "Tanque",
    ],
  },
];
