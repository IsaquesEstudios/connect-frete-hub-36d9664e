import { supabase } from "@/integrations/supabase/client";
import type { BroadcastAudience, NewUserInput, Repository } from "./repository";
import type { BroadcastMessage, Message, Tag, User, UserType } from "./types";

type ProfileRow = {
  id: string;
  user_number: string;
  type: UserType;
  name: string;
  cnpj: string | null;
  placa: string | null;
  veiculo: string | null;
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
  const base = { id: p.id, number: p.user_number, name: p.name, password: "", createdAt: 0 };
  if (p.type === "empresa") return { ...base, type: "empresa", cnpj: p.cnpj ?? "" };
  if (p.type === "motorista")
    return { ...base, type: "motorista", placa: p.placa ?? "", veiculo: p.veiculo ?? "" };
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

    // Purge orphan tags (no conversation using them)
    const usedTagIds = new Set(this.convTags.map((c) => c.tagId));
    const orphans = this.tags.filter((t) => !usedTagIds.has(t.id)).map((t) => t.id);
    if (orphans.length > 0) {
      this.tags = this.tags.filter((t) => usedTagIds.has(t.id));
      void supabase.from("tags").delete().in("id", orphans);
    }

    this.notify();
    if (!this.realtimeStarted) {
      this.realtimeStarted = true;
      this.subscribeRealtime();
    }
  }

  private async loadUsers() {
    const { data } = await supabase.from("profiles").select("*");
    if (data) this.users = (data as ProfileRow[]).map(profileToUser);
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
        const i = this.messages.findIndex((m) => m.id === tempId);
        if (i >= 0) this.messages[i] = real;
        else if (!this.messages.find((m) => m.id === real.id)) this.messages.push(real);
        this.notify();
      });
    return msg;
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
    const tempId = `tmp_${Date.now()}`;
    const tag: Tag = { id: tempId, ...input };
    this.tags.push(tag);
    this.notify();
    void supabase
      .from("tags")
      .insert({ label: input.label, color: input.color })
      .select("*")
      .single()
      .then(({ data, error }) => {
        if (error) {
          this.tags = this.tags.filter((t) => t.id !== tempId);
          this.notify();
          return;
        }
        const i = this.tags.findIndex((t) => t.id === tempId);
        if (i >= 0) this.tags[i] = data as Tag;
        this.notify();
      });
    return tag;
  }
  updateTag(id: string, patch: { label?: string; color?: string }): Tag | undefined {
    const t = this.tags.find((x) => x.id === id);
    if (!t) return undefined;
    Object.assign(t, patch);
    this.notify();
    void supabase.from("tags").update(patch).eq("id", id);
    return t;
  }
  deleteTag(id: string): void {
    this.tags = this.tags.filter((t) => t.id !== id);
    this.convTags = this.convTags.filter((c) => c.tagId !== id);
    this.notify();
    void supabase.from("tags").delete().eq("id", id);
  }

  getConversationTagIds(conversationId: string) {
    return this.convTags.filter((c) => c.conversationId === conversationId).map((c) => c.tagId);
  }
  setConversationTags(conversationId: string, tagIds: string[]) {
    const removedTagIds = this.convTags
      .filter((c) => c.conversationId === conversationId && !tagIds.includes(c.tagId))
      .map((c) => c.tagId);
    this.convTags = this.convTags.filter((c) => c.conversationId !== conversationId);
    for (const tagId of tagIds) this.convTags.push({ conversationId, tagId });

    // Purge tags that no longer have any conversation using them
    const orphanTagIds = removedTagIds.filter(
      (id) => !this.convTags.some((c) => c.tagId === id),
    );
    if (orphanTagIds.length > 0) {
      this.tags = this.tags.filter((t) => !orphanTagIds.includes(t.id));
    }

    this.notify();
    void (async () => {
      await supabase.from("conversation_tags").delete().eq("conversation_id", conversationId);
      if (tagIds.length > 0) {
        await supabase
          .from("conversation_tags")
          .insert(tagIds.map((tag_id) => ({ conversation_id: conversationId, tag_id })));
      }
      if (orphanTagIds.length > 0) {
        await supabase.from("tags").delete().in("id", orphanTagIds);
      }
    })();
  }

  // ============ broadcasts ============
  resolveBroadcastRecipients(a: BroadcastAudience): User[] {
    const nonAdmins = this.users.filter((u) => u.type !== "admin");
    if (a.kind === "all") return nonAdmins;
    if (a.kind === "empresas") return nonAdmins.filter((u) => u.type === "empresa");
    if (a.kind === "motoristas") return nonAdmins.filter((u) => u.type === "motorista");
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

  // ============ presence / typing (no-op — Supabase Realtime handles chat) ============
  setPresence(): void {}
  isOnline(userId: string): boolean {
    return userId === this.adminAuthId;
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
