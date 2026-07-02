import { useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_ID, repo, type Message, type User } from "@/lib/data";
import { useEphemeralVersion, useRepoVersion } from "@/lib/hooks/useRepo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDay(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === y.toDateString()) return "Ontem";
  return d.toLocaleDateString();
}

interface Props {
  me: User;
  other: User;
  viewer: "admin" | "user";
}

export function ChatWindow({ me, other, viewer }: Props) {
  const v = useRepoVersion();
  const ev = useEphemeralVersion();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const conversationId = other.type === "admin" ? me.id : other.id;

  const messages = useMemo(() => repo.listMessages(conversationId), [conversationId, v]);

  const otherOnline = useMemo(() => repo.isOnline(other.id), [other.id, ev, v]);

  // Typing indicator: is the other side typing in this conversation right now?
  const [otherTyping, setOtherTyping] = useState<number>(0);
  useEffect(() => {
    return repo.subscribeEphemeral((e) => {
      if (e.type !== "typing") return;
      const p = e.payload as { conversationId: string; fromUserId: string; ts: number };
      if (p.conversationId === conversationId && p.fromUserId === other.id) {
        setOtherTyping(p.ts);
      }
    });
  }, [conversationId, other.id]);
  const typingActive = Date.now() - otherTyping < 2500;
  useEffect(() => {
    if (!typingActive) return;
    const t = setTimeout(() => setOtherTyping(0), 2600);
    return () => clearTimeout(t);
  }, [typingActive, otherTyping]);

  // Mark read on view
  useEffect(() => {
    repo.markConversationRead(conversationId, viewer);
  }, [conversationId, viewer, v]);

  // Autoscroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, conversationId]);

  function send() {
    const body = text.trim();
    if (!body) return;
    repo.sendMessage({ fromUserId: me.id, toUserId: other.id, body });
    setText("");
  }

  function onType(v: string) {
    setText(v);
    repo.sendTyping(conversationId, me.id);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
  }

  // Group by day
  const groups: { day: string; items: Message[] }[] = [];
  for (const m of messages) {
    const day = fmtDay(m.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(m);
    else groups.push({ day, items: [m] });
  }

  const otherColor =
    other.type === "empresa"
      ? "bg-[hsl(var(--company))]"
      : other.type === "motorista"
        ? "bg-[hsl(var(--driver))]"
        : "bg-primary";

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${otherColor}`}
        >
          {other.name
            .split(" ")
            .slice(0, 2)
            .map((s) => s[0])
            .join("")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{other.name}</div>
          <div className="text-xs text-muted-foreground">
            {other.number} ·{" "}
            {typingActive ? (
              <span className="text-primary">digitando...</span>
            ) : otherOnline ? (
              <span className="text-emerald-600">online</span>
            ) : (
              <span>offline</span>
            )}
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {groups.length === 0 && (
          <div className="text-center text-sm text-muted-foreground pt-10">
            Nenhuma mensagem ainda. Diga olá!
          </div>
        )}
        {groups.map((g) => (
          <div key={g.day} className="space-y-2">
            <div className="flex justify-center">
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {g.day}
              </span>
            </div>
            {g.items.map((m) => {
              const mine = m.fromUserId === me.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border rounded-bl-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    <div
                      className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"} text-right`}
                    >
                      {fmtTime(m.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <form
        className="border-t bg-card p-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Input
          value={text}
          onChange={(e) => onType(e.target.value)}
          placeholder={
            other.id === ADMIN_ID
              ? "Escreva uma mensagem para o Admin..."
              : `Responder ${other.name}...`
          }
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
