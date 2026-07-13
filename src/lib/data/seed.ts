import type { ConversationTag, Message, Tag, User } from "./types";

export const ADMIN_ID = "ADM-0001";

const now = Date.now();
const min = (n: number) => now - n * 60_000;

export const seedUsers: User[] = [
  {
    id: ADMIN_ID,
    number: ADMIN_ID,
    type: "admin",
    name: "Central ConectaFrete",
    password: "admin",
    createdAt: now,
  },
  ...[
    { name: "Transportes Andrade Ltda", cnpj: "12.345.678/0001-01" },
    { name: "LogFast Distribuidora", cnpj: "23.456.789/0001-02" },
    { name: "Cargas do Sul SA", cnpj: "34.567.890/0001-03" },
    { name: "Rota Norte Fretes", cnpj: "45.678.901/0001-04" },
    { name: "Expresso Bandeirantes", cnpj: "56.789.012/0001-05" },
  ].map((e, i): User => ({
    id: `EMP-000${i + 1}`,
    number: `EMP-000${i + 1}`,
    type: "empresa",
    name: e.name,
    cnpj: e.cnpj,
    password: "123",
    createdAt: now,
  })),
  ...[
    { name: "João Pereira", placa: "ABC-1D23", tipoVeiculo: "Veículos pesados — Carreta" },
    { name: "Marcos Silva", placa: "DEF-4E56", tipoVeiculo: "Veículos pesados — Carreta" },
    { name: "Ricardo Alves", placa: "GHI-7F89", tipoVeiculo: "Veículos pesados — Carreta" },
    { name: "Paulo Souza", placa: "JKL-0G12", tipoVeiculo: "Veículos pesados — Carreta" },
    { name: "Carlos Nunes", placa: "MNO-3H45", tipoVeiculo: "Veículos pesados — Carreta" },
  ].map((m, i): User => ({
    id: `MOT-000${i + 1}`,
    number: `MOT-000${i + 1}`,
    type: "motorista",
    name: m.name,
    placa: m.placa,
    tipoVeiculo: m.tipoVeiculo,
    password: "123",
    createdAt: now,
  })),
];

export const seedTags: Tag[] = [
  { id: "t-urgente", label: "Urgente", color: "#ef4444" },
  { id: "t-sp", label: "SP", color: "#3b82f6" },
  { id: "t-frota", label: "Frota Própria", color: "#8b5cf6" },
  { id: "t-novo", label: "Novo Cliente", color: "#10b981" },
  { id: "t-vip", label: "VIP", color: "#f59e0b" },
  { id: "t-problema", label: "Problema", color: "#f43f5e" },
];

function mkMsg(
  id: string,
  conv: string,
  from: string,
  to: string,
  body: string,
  minutesAgo: number,
): Message {
  return {
    id,
    conversationId: conv,
    fromUserId: from,
    toUserId: to,
    body,
    createdAt: min(minutesAgo),
    readByAdmin: true,
    readByUser: true,
  };
}

export const seedMessages: Message[] = [
  // EMP-0001
  mkMsg("m1", "EMP-0001", "EMP-0001", ADMIN_ID, "Bom dia, preciso de um frete para Campinas.", 240),
  mkMsg("m2", "EMP-0001", ADMIN_ID, "EMP-0001", "Bom dia! Qual o volume e a data?", 235),
  mkMsg("m3", "EMP-0001", "EMP-0001", ADMIN_ID, "10 toneladas, saída amanhã 08h.", 230),
  mkMsg("m4", "EMP-0001", ADMIN_ID, "EMP-0001", "Perfeito, vou alinhar com um motorista.", 225),
  // EMP-0002
  mkMsg("m5", "EMP-0002", ADMIN_ID, "EMP-0002", "Olá, seu último frete foi entregue com sucesso.", 120),
  mkMsg("m6", "EMP-0002", "EMP-0002", ADMIN_ID, "Ótimo, obrigado!", 115),
  // EMP-0003
  mkMsg("m7", "EMP-0003", "EMP-0003", ADMIN_ID, "Precisamos de 3 caminhões para semana que vem.", 60),
  // EMP-0004
  mkMsg("m8", "EMP-0004", "EMP-0004", ADMIN_ID, "Boa tarde, tem disponibilidade para Curitiba?", 30),
  // EMP-0005
  mkMsg("m9", "EMP-0005", ADMIN_ID, "EMP-0005", "Confirmando: coleta 14h no CD Guarulhos.", 15),
  mkMsg("m10", "EMP-0005", "EMP-0005", ADMIN_ID, "Confirmado.", 10),

  // MOT-0001
  mkMsg("m11", "MOT-0001", ADMIN_ID, "MOT-0001", "João, tenho um frete SP → Campinas amanhã, topa?", 220),
  mkMsg("m12", "MOT-0001", "MOT-0001", ADMIN_ID, "Topo sim, me passa os detalhes.", 215),
  mkMsg("m13", "MOT-0001", ADMIN_ID, "MOT-0001", "Coleta 08h no cliente EMP-0001.", 210),
  // MOT-0002
  mkMsg("m14", "MOT-0002", "MOT-0002", ADMIN_ID, "Cheguei no destino, tudo certo.", 90),
  mkMsg("m15", "MOT-0002", ADMIN_ID, "MOT-0002", "Ótimo, envie o canhoto.", 85),
  // MOT-0003
  mkMsg("m16", "MOT-0003", "MOT-0003", ADMIN_ID, "Estou disponível a partir de quinta.", 45),
  // MOT-0004
  mkMsg("m17", "MOT-0004", ADMIN_ID, "MOT-0004", "Paulo, tem interesse em rota Sul?", 25),
  mkMsg("m18", "MOT-0004", "MOT-0004", ADMIN_ID, "Tenho, pode mandar.", 20),
  // MOT-0005
  mkMsg("m19", "MOT-0005", "MOT-0005", ADMIN_ID, "Problema mecânico, atrasarei 2h.", 5),
];

export const seedConversationTags: ConversationTag[] = [
  { conversationId: "EMP-0001", tagId: "t-sp" },
  { conversationId: "EMP-0001", tagId: "t-vip" },
  { conversationId: "EMP-0003", tagId: "t-novo" },
  { conversationId: "EMP-0004", tagId: "t-urgente" },
  { conversationId: "EMP-0005", tagId: "t-frota" },
  { conversationId: "MOT-0001", tagId: "t-sp" },
  { conversationId: "MOT-0004", tagId: "t-vip" },
  { conversationId: "MOT-0005", tagId: "t-problema" },
  { conversationId: "MOT-0005", tagId: "t-urgente" },
];

