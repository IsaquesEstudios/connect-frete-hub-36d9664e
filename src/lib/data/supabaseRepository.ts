import { supabase } from "@/integrations/supabase/loose-client";
import type { BroadcastAudience, NewUserInput, Repository } from "./repository";
import type { BroadcastMessage, Message, Tag, User, UserType } from "./types";

type ProfileRow = {
  id: string;
  user_number: string;
  type: UserType;
  name: string;
  cnpj: string | null;
  cpf: string | null;
  placa: string | null;
  veiculo: string | null;
  last_seen_at?: string | null;
  active?: boolean | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  created_at: string;
  read_by_admin: boolean;
  read_by_user: boolean;
};

type BroadcastRow = {
  id: string;
  body: string;
  audience: string;
  tag_id: string | null;
  sent_at: string;
  recipient_count: number;
};

export function profileToUser(p: ProfileRow): User {
  const active = p.active ?? true;
  const base = { id: p.id, number: p.user_number, name: p.name, password: "", createdAt: 0, active };
  if (p.type === "empresa") return { ...base, type: "empresa", cnpj: p.cnpj ?? "" };
  if (p.type === "motorista")
    return { ...base, type: "motorista", placa: p.placa ?? "", veiculo: p.veiculo ?? "", cpf: p.cpf ?? undefined };
  if (p.type === "colaborador") return { ...base, type: "colaborador" };
  return { ...base, type: "admin" };
}


function mapMessage(r: MessageRow): Message {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    fromUserId: r.from_user_id,
    toUserId: r.to_user_id,
    body: r.body,
    createdAt: new Date(r.created_at).getTime(),
    readByAdmin: r.read_by_admin,
    readByUser: r.read_by_user,
  };
}

function mapBroadcast(r: BroadcastRow): BroadcastMessage {
  return {
    id: r.id,
    body: r.body,
    audience: r.audience as BroadcastMessage["audience"],
    tagId: r.tag_id ?? undefined,
    sentAt: new Date(r.sent_at).getTime(),
    recipientCount: r.recipient_count,
  };
}

class SupabaseRepository implements Repository {
  private users: User[] = [];
  private messages: Message[] = [];
  private tags: Tag[] = [];
  private convTags: { conversationId: string; tagId: string }[] = [];
  private broadcasts: BroadcastMessage[] = [];
  private subs = new Set<() => void>();
  private adminAuthId: string | null = null;
  private realtimeStarted = false;
  private onlineIds = new Set<string>();
  private lastSeen = new Map<string, number>();
  private heartbeatTimer: number | null = null;
  private presenceChannel: ReturnType<typeof supabase.channel> | null = null;
  private pendingTagSaves = new Map<string, Promise<boolean>>();

  constructor() {
    if (typeof window !== "undefined") {
      // Kick off boot; also reload when auth changes (RLS lets user see own rows).
      void this.bootstrap();
      supabase.auth.onAuthStateChange(() => {
        void this.bootstrap();
      });
    }
  }

  private notify() {
    this.subs.forEach((cb) => cb());
  }

  private async bootstrap() {
    await Promise.all([
      this.loadUsers(),
      this.loadTags(),
      this.loadConvTags(),
      this.loadMessages(),
      this.loadBroadcasts(),
    ]);
    const admin = this.users.find((u) => u.type === "admin");
    this.adminAuthId = admin?.id ?? null;

    this.notify();
    if (!this.realtimeStarted) {
      this.realtimeStarted = true;
      this.subscribeRealtime();
    }
  }

  private async loadUsers() {
    const { data } = await supabase.from("profiles").select("*");
    if (data) {
      const rows = data as ProfileRow[];
      this.users = rows.map(profileToUser);
      for (const r of rows) {
        if (r.last_seen_at) this.lastSeen.set(r.id, new Date(r.last_seen_at).getTime());
      }
    }
  }
  private async loadTags() {
    const { data } = await supabase.from("tags").select("*").order("label");
    if (data) this.tags = (data as Tag[]).map((t) => ({ id: t.id, label: t.label, color: t.color }));
  }
  private async loadConvTags() {
    const { data } = await supabase.from("conversation_tags").select("*");
    if (data)
      this.convTags = (data as { conversation_id: string; tag_id: string }[]).map((c) => ({
        conversationId: c.conversation_id,
        tagId: c.tag_id,
      }));
  }
  private async loadMessages() {
    const { data } = await supabase.from("messages").select("*").order("created_at");
    if (data) this.messages = (data as MessageRow[]).map(mapMessage);
  }
  private async loadBroadcasts() {
    const { data } = await supabase
      .from("broadcast_messages")
      .select("*")
      .order("sent_at", { ascending: false });
    if (data) this.broadcasts = (data as BroadcastRow[]).map(mapBroadcast);
  }

  private subscribeRealtime() {
    supabase
      .channel("cf-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const m = mapMessage(payload.new as MessageRow);
            if (!this.messages.find((x) => x.id === m.id)) this.messages.push(m);
          } else if (payload.eventType === "UPDATE") {
            const m = mapMessage(payload.new as MessageRow);
            const i = this.messages.findIndex((x) => x.id === m.id);
            if (i >= 0) this.messages[i] = m;
          } else if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id: string }).id;
            this.messages = this.messages.filter((x) => x.id !== oldId);
          }
          this.notify();
        },
      )
      .subscribe();

    supabase
      .channel("cf-tags")
      .on("postgres_changes", { event: "*", schema: "public", table: "tags" }, () => {
        void this.loadTags().then(() => this.notify());
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_tags" },
        () => {
          void this.loadConvTags().then(() => this.notify());
        },
      )
      .subscribe();
  }

  // ============ users ============
  listUsers() {
    return this.users;
  }
  getUser(idOrNumber: string) {
    return this.users.find((u) => u.id === idOrNumber || u.number === idOrNumber);
  }
  nextNumberFor(_type: UserType): string {
    return "";
  }
  createUser(_: NewUserInput): User {
    throw new Error("Use Supabase Auth signUp");
  }

  // ============ messages ============
  listMessages(conversationId: string) {
    return this.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  sendMessage({
    fromUserId,
    toUserId,
    body,
  }: {
    fromUserId: string;
    toUserId: string;
    body: string;
  }): Message {
    const admin = this.adminAuthId;
    const nonAdminAuthId = fromUserId === admin ? toUserId : fromUserId;
    const nonAdmin = this.users.find((u) => u.id === nonAdminAuthId);
    const conversationId = nonAdmin?.number ?? "";
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();
    const msg: Message = {
      id: tempId,
      conversationId,
      fromUserId,
      toUserId,
      body,
      createdAt: now,
      readByAdmin: fromUserId === admin,
      readByUser: fromUserId !== admin,
    };
    this.messages.push(msg);
    this.notify();

    void supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        body,
        read_by_admin: fromUserId === admin,
        read_by_user: fromUserId !== admin,
      })
      .select("*")
      .single()
      .then(({ data, error }) => {
        if (error) {
          this.messages = this.messages.filter((m) => m.id !== tempId);
          this.notify();
          console.error("sendMessage failed", error);
          return;
        }
        const real = mapMessage(data as MessageRow);
        const tempIdx = this.messages.findIndex((m) => m.id === tempId);
        const realIdx = this.messages.findIndex((m) => m.id === real.id);
        if (realIdx >= 0) {
          // Realtime já entregou a mensagem — apenas remove o placeholder temp.
          if (tempIdx >= 0) this.messages.splice(tempIdx, 1);
        } else if (tempIdx >= 0) {
          this.messages[tempIdx] = real;
        } else {
          this.messages.push(real);
        }
        this.notify();
      });
    return msg;
  }

  deleteMessage(id: string): void {
    const prev = this.messages;
    this.messages = this.messages.filter((m) => m.id !== id);
    this.notify();
    void supabase
      .from("messages")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.error("deleteMessage failed", error);
          this.messages = prev;
          this.notify();
          alert("Não foi possível excluir a mensagem.");
        }
      });
  }

  deleteConversation(conversationId: string): void {
    const prevMsgs = this.messages;
    const prevConv = this.convTags;
    this.messages = this.messages.filter((m) => m.conversationId !== conversationId);
    this.convTags = this.convTags.filter((c) => c.conversationId !== conversationId);
    this.notify();
    void (async () => {
      await supabase.from("conversation_tags").delete().eq("conversation_id", conversationId);
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId);
      if (error) {
        console.error("deleteConversation failed", error);
        this.messages = prevMsgs;
        this.convTags = prevConv;
        this.notify();
        alert("Não foi possível excluir a conversa.");
      }
    })();
  }

  markConversationRead(conversationId: string, viewer: "admin" | "user") {
    const field = viewer === "admin" ? "read_by_admin" : "read_by_user";
    let changed = false;
    for (const m of this.messages) {
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
    if (changed) this.notify();
    void supabase
      .from("messages")
      .update({ [field]: true })
      .eq("conversation_id", conversationId)
      .eq(field, false);
  }

  unreadCount(conversationId: string, viewer: "admin" | "user"): number {
    return this.messages.filter((m) => {
      if (m.conversationId !== conversationId) return false;
      if (viewer === "admin") return m.toUserId === this.adminAuthId && !m.readByAdmin;
      return m.fromUserId === this.adminAuthId && !m.readByUser;
    }).length;
  }

  listConversations() {
    const nonAdmins = this.users.filter((u) => u.type !== "admin");
    return nonAdmins
      .map((user) => {
        const conv = this.messages.filter((m) => m.conversationId === user.number);
        const lastMessage = [...conv].sort((a, b) => b.createdAt - a.createdAt)[0];
        const unreadForAdmin = conv.filter(
          (m) => m.toUserId === this.adminAuthId && !m.readByAdmin,
        ).length;
        const tagIds = this.convTags
          .filter((c) => c.conversationId === user.number)
          .map((c) => c.tagId);
        return { user, lastMessage, unreadForAdmin, tagIds };
      })
      .sort((a, b) => (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0));
  }

  // ============ tags ============
  listTags() {
    return this.tags;
  }
  createTag(input: { label: string; color: string }): Tag {
    const id = globalThis.crypto?.randomUUID?.() ?? `tag_${Date.now()}`;
    const tag: Tag = { id, ...input };
    this.tags.push(tag);
    this.notify();
    const save: Promise<boolean> = (async () => {
      const { data, error } = await supabase
        .from("tags")
        .insert({ id, label: input.label, color: input.color })
        .select("*")
        .single();
        if (error) {
          throw error;
        }
        const saved = data as Tag;
        const i = this.tags.findIndex((t) => t.id === id);
        if (i >= 0) this.tags[i] = saved;
        else if (!this.tags.some((t) => t.id === saved.id)) this.tags.push(saved);
        this.notify();
        return true;
      })()
      .catch((error: unknown) => {
        console.error("createTag failed", error);
        this.tags = this.tags.filter((t) => t.id !== id);
        this.convTags = this.convTags.filter((c) => c.tagId !== id);
        this.notify();
        alert("Não foi possível salvar a tag.");
        return false;
      })
      .finally(() => {
        this.pendingTagSaves.delete(id);
      });
    this.pendingTagSaves.set(id, save);
    return tag;
  }
  updateTag(id: string, patch: { label?: string; color?: string }): Tag | undefined {
    const t = this.tags.find((x) => x.id === id);
    if (!t) return undefined;
    const previous = { ...t };
    Object.assign(t, patch);
    this.notify();
    void (async () => {
      const { data, error } = await supabase
        .from("tags")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
        if (error) throw error;
        Object.assign(t, data as Tag);
        this.notify();
      })().catch((error: unknown) => {
        console.error("updateTag failed", error);
        Object.assign(t, previous);
        this.notify();
        alert("Não foi possível salvar as alterações da tag.");
      });
    return t;
  }
  deleteTag(id: string): void {
    const prevTags = this.tags;
    const prevConv = this.convTags;
    this.tags = this.tags.filter((t) => t.id !== id);
    this.convTags = this.convTags.filter((c) => c.tagId !== id);
    this.notify();
    void (async () => {
      await supabase.from("conversation_tags").delete().eq("tag_id", id);
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) {
        console.error("deleteTag failed", error);
        this.tags = prevTags;
        this.convTags = prevConv;
        this.notify();
        alert(
          "Não foi possível excluir a tag no banco (provavelmente falta política RLS DELETE).",
        );
      }
    })();
  }

  getConversationTagIds(conversationId: string) {
    return this.convTags.filter((c) => c.conversationId === conversationId).map((c) => c.tagId);
  }
  setConversationTags(conversationId: string, tagIds: string[]) {
    const uniqueTagIds = Array.from(new Set(tagIds));
    const prevConv = [...this.convTags];
    this.convTags = this.convTags.filter((c) => c.conversationId !== conversationId);
    for (const tagId of uniqueTagIds) this.convTags.push({ conversationId, tagId });

    this.notify();
    void (async () => {
      const pending = uniqueTagIds
        .map((tagId) => this.pendingTagSaves.get(tagId))
        .filter((save): save is Promise<boolean> => Boolean(save));
      if (pending.length > 0) {
        const saved = await Promise.all(pending);
        if (saved.some((ok) => !ok)) throw new Error("A tag ainda não foi salva.");
      }

      const validTagIds = uniqueTagIds.filter((tagId) => this.tags.some((t) => t.id === tagId));
      const { error: deleteError } = await supabase
        .from("conversation_tags")
        .delete()
        .eq("conversation_id", conversationId);
      if (deleteError) throw deleteError;
      if (validTagIds.length > 0) {
        const { error: insertError } = await supabase
          .from("conversation_tags")
          .insert(validTagIds.map((tag_id) => ({ conversation_id: conversationId, tag_id })));
        if (insertError) throw insertError;
      }
    })().catch((error) => {
      console.error("setConversationTags failed", error);
      this.convTags = prevConv;
      this.notify();
      alert("Não foi possível salvar as tags desta conversa.");
    });
  }

  // ============ broadcasts ============
  resolveBroadcastRecipients(a: BroadcastAudience): User[] {
    const nonAdmins = this.users.filter((u) => u.type !== "admin");
    if (a.kind === "all") return nonAdmins;
    if (a.kind === "empresas") return nonAdmins.filter((u) => u.type === "empresa");
    if (a.kind === "motoristas") return nonAdmins.filter((u) => u.type === "motorista");
    if (a.kind === "colaboradores") return nonAdmins.filter((u) => u.type === "colaborador");
    const nums = new Set(
      this.convTags.filter((c) => c.tagId === a.tagId).map((c) => c.conversationId),
    );
    return nonAdmins.filter((u) => nums.has(u.number));
  }
  sendBroadcast({
    body,
    audience,
    fromUserId,
  }: {
    body: string;
    audience: BroadcastAudience;
    fromUserId: string;
  }): BroadcastMessage {
    const recipients = this.resolveBroadcastRecipients(audience);
    const now = Date.now();
    const rows = recipients.map((r) => ({
      conversation_id: r.number,
      from_user_id: fromUserId,
      to_user_id: r.id,
      body,
      read_by_admin: true,
      read_by_user: false,
    }));
    if (rows.length > 0)
      void supabase
        .from("messages")
        .insert(rows)
        .select("*")
        .then(({ data }) => {
          if (data) {
            for (const row of data as MessageRow[]) {
              const m = mapMessage(row);
              if (!this.messages.find((x) => x.id === m.id)) this.messages.push(m);
            }
            this.notify();
          }
        });
    const record: BroadcastMessage = {
      id: `tmp_${now}`,
      body,
      audience: audience.kind,
      tagId: audience.kind === "tag" ? audience.tagId : undefined,
      sentAt: now,
      recipientCount: recipients.length,
    };
    this.broadcasts.unshift(record);
    this.notify();
    void supabase
      .from("broadcast_messages")
      .insert({
        body,
        audience: audience.kind,
        tag_id: audience.kind === "tag" ? audience.tagId : null,
        recipient_count: recipients.length,
      })
      .select("*")
      .single()
      .then(({ data }) => {
        if (data) {
          const i = this.broadcasts.findIndex((b) => b.id === record.id);
          if (i >= 0) this.broadcasts[i] = mapBroadcast(data as BroadcastRow);
          this.notify();
        }
      });
    return record;
  }
  listBroadcasts() {
    return this.broadcasts;
  }

  // ============ presence ============
  setPresence(userId: string, online: boolean): void {
    if (!userId) return;
    if (online) {
      // Start heartbeat + join realtime presence channel
      if (this.presenceChannel && this.heartbeatTimer) return;
      this.startPresence(userId);
    } else {
      this.stopPresence(userId);
    }
  }

  private startPresence(userId: string) {
    // Join a shared presence channel
    const channel = supabase.channel("cf-presence", {
      config: { presence: { key: userId } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        this.onlineIds = new Set(Object.keys(state));
        this.notify();
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ online_at: Date.now() });
      });
    this.presenceChannel = channel;

    const beat = async () => {
      const iso = new Date().toISOString();
      this.lastSeen.set(userId, Date.now());
      await supabase.from("profiles").update({ last_seen_at: iso }).eq("id", userId);
    };
    void beat();
    this.heartbeatTimer = window.setInterval(beat, 30_000);

    window.addEventListener("beforeunload", () => this.stopPresence(userId));
  }

  private stopPresence(userId: string) {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.presenceChannel) {
      void this.presenceChannel.untrack();
      void supabase.removeChannel(this.presenceChannel);
      this.presenceChannel = null;
    }
    const iso = new Date().toISOString();
    this.lastSeen.set(userId, Date.now());
    void supabase.from("profiles").update({ last_seen_at: iso }).eq("id", userId);
  }

  isOnline(userId: string): boolean {
    return this.onlineIds.has(userId);
  }
  getLastSeen(userId: string): number | null {
    return this.lastSeen.get(userId) ?? null;
  }
  sendTyping(): void {}

  subscribe(cb: () => void): () => void {
    this.subs.add(cb);
    return () => {
      this.subs.delete(cb);
    };
  }
  subscribeEphemeral(): () => void {
    return () => {};
  }
}

export const repo: Repository = new SupabaseRepository();
