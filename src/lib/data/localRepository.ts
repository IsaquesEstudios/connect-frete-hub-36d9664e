import type { NewUserInput, Repository } from "./repository";
import type { Message, User, UserType } from "./types";
import { ADMIN_ID, seedMessages, seedTags, seedUsers } from "./seed";
import {
  broadcastEphemeral,
  readJSON,
  subscribe,
  subscribeEphemeral,
  writeJSON,
} from "./storage";

const K_USERS = "users";
const K_MSGS = "messages";
const K_TAGS = "tags";
const K_SEEDED = "seeded_v1";

function ensureSeed() {
  if (readJSON<boolean>(K_SEEDED, false)) return;
  writeJSON(K_USERS, seedUsers);
  writeJSON(K_MSGS, seedMessages);
  writeJSON(K_TAGS, seedTags);
  writeJSON(K_SEEDED, true);
}

const presence = new Map<string, number>(); // userId -> lastSeenTs
const ONLINE_WINDOW = 15_000;

class LocalRepository implements Repository {
  constructor() {
    ensureSeed();
  }

  listUsers(): User[] {
    return readJSON<User[]>(K_USERS, []);
  }

  getUser(id: string): User | undefined {
    return this.listUsers().find((u) => u.id === id);
  }

  nextNumberFor(type: UserType): string {
    const prefix = type === "empresa" ? "EMP" : type === "motorista" ? "MOT" : "ADM";
    const nums = this.listUsers()
      .filter((u) => u.type === type)
      .map((u) => parseInt(u.number.split("-")[1] || "0", 10));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}-${String(next).padStart(4, "0")}`;
  }

  createUser(input: NewUserInput): User {
    const number = this.nextNumberFor(input.type);
    const user = { ...input, id: number, number, createdAt: Date.now() } as User;
    const users = this.listUsers();
    users.push(user);
    writeJSON(K_USERS, users);
    return user;
  }

  listMessages(conversationId: string): Message[] {
    return readJSON<Message[]>(K_MSGS, [])
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  sendMessage(input: { fromUserId: string; toUserId: string; body: string }): Message {
    const conversationId = input.fromUserId === ADMIN_ID ? input.toUserId : input.fromUserId;
    const msg: Message = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      conversationId,
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      body: input.body,
      createdAt: Date.now(),
      readByAdmin: input.fromUserId === ADMIN_ID,
      readByUser: input.fromUserId !== ADMIN_ID,
    };
    const all = readJSON<Message[]>(K_MSGS, []);
    all.push(msg);
    writeJSON(K_MSGS, all);
    return msg;
  }

  markConversationRead(conversationId: string, viewer: "admin" | "user") {
    const all = readJSON<Message[]>(K_MSGS, []);
    let changed = false;
    for (const m of all) {
      if (m.conversationId !== conversationId) continue;
      if (viewer === "admin" && !m.readByAdmin) {
        m.readByAdmin = true;
        changed = true;
      }
      if (viewer === "user" && !m.readByUser) {
        m.readByUser = true;
        changed = true;
      }
    }
    if (changed) writeJSON(K_MSGS, all);
  }

  unreadCount(conversationId: string, viewer: "admin" | "user"): number {
    return readJSON<Message[]>(K_MSGS, []).filter((m) => {
      if (m.conversationId !== conversationId) return false;
      if (viewer === "admin") return m.toUserId === ADMIN_ID && !m.readByAdmin;
      return m.fromUserId === ADMIN_ID && !m.readByUser;
    }).length;
  }

  listConversations() {
    const users = this.listUsers().filter((u) => u.type !== "admin");
    const msgs = readJSON<Message[]>(K_MSGS, []);
    return users
      .map((user) => {
        const conv = msgs.filter((m) => m.conversationId === user.id);
        const lastMessage = conv.sort((a, b) => b.createdAt - a.createdAt)[0];
        const unreadForAdmin = conv.filter((m) => m.toUserId === ADMIN_ID && !m.readByAdmin).length;
        return { user, lastMessage, unreadForAdmin };
      })
      .sort((a, b) => (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0));
  }

  setPresence(userId: string, online: boolean) {
    if (online) {
      presence.set(userId, Date.now());
      broadcastEphemeral("presence", { userId, ts: Date.now() });
    } else {
      presence.delete(userId);
      broadcastEphemeral("presence-off", { userId });
    }
  }

  isOnline(userId: string): boolean {
    const ts = presence.get(userId);
    return !!ts && Date.now() - ts < ONLINE_WINDOW;
  }

  sendTyping(conversationId: string, fromUserId: string) {
    broadcastEphemeral("typing", { conversationId, fromUserId, ts: Date.now() });
  }

  subscribe(cb: () => void): () => void {
    return subscribe(() => cb());
  }

  subscribeEphemeral(cb: (e: { type: string; payload: unknown }) => void) {
    // Track presence updates locally
    const wrap = (e: { type: string; payload: unknown }) => {
      if (e.type === "presence") {
        const p = e.payload as { userId: string; ts: number };
        presence.set(p.userId, p.ts);
      } else if (e.type === "presence-off") {
        const p = e.payload as { userId: string };
        presence.delete(p.userId);
      }
      cb(e);
    };
    return subscribeEphemeral(wrap);
  }
}

export const repo: Repository = new LocalRepository();
