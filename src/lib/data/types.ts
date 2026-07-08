export type UserType = "empresa" | "motorista" | "admin" | "colaborador";

export interface BaseUser {
  id: string; // same as number, e.g. EMP-0001
  number: string;
  type: UserType;
  name: string;
  password: string; // mock only
  createdAt: number;
  cpf?: string;
  active?: boolean;
  email?: string;
  whatsapp?: string;
  cidade?: string;
  estado?: string;
  fotoUrl?: string;
}

export interface EmpresaUser extends BaseUser {
  type: "empresa";
  cnpj: string;
  nomeFantasia?: string;
  perfilEmpresa?: string;
  siteRedeSocial?: string;
}

export interface MotoristaUser extends BaseUser {
  type: "motorista";
  placa: string;
  veiculo: string;
  tipoVeiculo?: string;
  rntrc?: string;
  carroceria?: string;
}

export interface AdminUser extends BaseUser {
  type: "admin";
}

export interface ColaboradorUser extends BaseUser {
  type: "colaborador";
}

export type User = EmpresaUser | MotoristaUser | AdminUser | ColaboradorUser;


export interface Message {
  id: string;
  conversationId: string; // = the non-admin user's number (EMP-0001 / MOT-0001)
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: number;
  readByAdmin?: boolean;
  readByUser?: boolean;
}

export interface Tag {
  id: string;
  label: string;
  color: string; // hex
}

export interface ConversationTag {
  conversationId: string;
  tagId: string;
}

export interface BroadcastMessage {
  id: string;
  body: string;
  audience: "all" | "empresas" | "motoristas" | "colaboradores" | "tag";
  tagId?: string;
  sentAt: number;
  recipientCount: number;
}
