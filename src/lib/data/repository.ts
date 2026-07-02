import type { BroadcastMessage, Message, Tag, User, UserType } from "./types";

export type BroadcastAudience =
  | { kind: "all" }
  | { kind: "empresas" }
  | { kind: "motoristas" }
  | { kind: "tag"; tagId: string };

export type NewUserInput =
  | { type: "empresa"; name: string; password: string; cnpj: string }
  | { type: "motorista"; name: string; password: string; placa: string; veiculo: string }
  | { type: "admin"; name: string; password: string };

export interface Repository {
  // users
  listUsers(): User[];
  getUser(id: string): User | undefined;
  createUser(u: NewUserInput): User;
  // messages
  listMessages(conversationId: string): Message[];
  sendMessage(input: { fromUserId: string; toUserId: string; body: string }): Message;
  markConversationRead(conversationId: string, viewer: "admin" | "user"): void;
  unreadCount(conversationId: string, viewer: "admin" | "user"): number;
  // conversations
  listConversations(): {
    user: User;
    lastMessage?: Message;
    unreadForAdmin: number;
    tagIds: string[];
  }[];
  // tags
  listTags(): Tag[];
  createTag(input: { label: string; color: string }): Tag;
  updateTag(id: string, patch: { label?: string; color?: string }): Tag | undefined;
  deleteTag(id: string): void;
  getConversationTagIds(conversationId: string): string[];
  setConversationTags(conversationId: string, tagIds: string[]): void;
  // broadcasts
  resolveBroadcastRecipients(audience: BroadcastAudience): User[];
  sendBroadcast(input: { body: string; audience: BroadcastAudience; fromUserId: string }): BroadcastMessage;
  listBroadcasts(): BroadcastMessage[];
  // presence / typing (ephemeral)
  setPresence(userId: string, online: boolean): void;
  isOnline(userId: string): boolean;
  sendTyping(conversationId: string, fromUserId: string): void;
  // subs
  subscribe(cb: () => void): () => void;
  subscribeEphemeral(cb: (e: { type: string; payload: unknown }) => void): () => void;
  // utils
  nextNumberFor(type: UserType): string;
}
