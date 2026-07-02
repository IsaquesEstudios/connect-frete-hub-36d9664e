import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { AppHeader } from "@/components/chat/AppHeader";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { repo } from "@/lib/data";
import { homeFor } from "@/lib/auth/session";
import { usePresenceHeartbeat, useRepoVersion } from "@/lib/hooks/useRepo";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — ConectaFrete" }] }),
  component: AdminPanel,
});

type FilterTab = "todos" | "empresas" | "motoristas";

function timeAgo(ts?: number) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function AdminPanel() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  usePresenceHeartbeat(user.id);
  const v = useRepoVersion();

  useEffect(() => {
    if (user.type !== "admin") navigate({ to: homeFor(user) as "/admin" });
  }, [user, navigate]);

  const [tab, setTab] = useState<FilterTab>("todos");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileChat, setMobileChat] = useState(false);

  const conversations = useMemo(() => repo.listConversations(), [v]);
  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (tab === "empresas" && c.user.type !== "empresa") return false;
      if (tab === "motoristas" && c.user.type !== "motorista") return false;
      if (query) {
        const q = query.toLowerCase();
        return c.user.name.toLowerCase().includes(q) || c.user.number.toLowerCase().includes(q);
      }
      return true;
    });
  }, [conversations, tab, query]);

  const stats = useMemo(() => {
    const empresas = conversations.filter((c) => c.user.type === "empresa").length;
    const motoristas = conversations.filter((c) => c.user.type === "motorista").length;
    const active = conversations.filter((c) => c.lastMessage).length;
    const unread = conversations.reduce((n, c) => n + c.unreadForAdmin, 0);
    return { empresas, motoristas, active, unread };
  }, [conversations]);

  if (user.type !== "admin") return null;

  const selectedUser = selected ? repo.getUser(selected) : null;

  return (
    <div className="h-screen flex flex-col">
      <AppHeader user={user} accent="bg-primary" />

      {/* Dashboard */}
      <div className="grid grid-cols-4 gap-2 border-b bg-card px-4 py-2 text-xs">
        <Stat label="Empresas" value={stats.empresas} />
        <Stat label="Motoristas" value={stats.motoristas} />
        <Stat label="Conversas" value={stats.active} />
        <Stat label="Não lidas" value={stats.unread} highlight={stats.unread > 0} />
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Sidebar */}
        <aside
          className={`${
            mobileChat ? "hidden" : "flex"
          } md:flex flex-col w-full md:w-96 md:min-w-96 border-r bg-card`}
        >
          <div className="p-3 space-y-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou número..."
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
              <TabsList className="grid grid-cols-3 w-full h-8">
                <TabsTrigger value="todos" className="text-xs">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="empresas" className="text-xs">
                  Empresas
                </TabsTrigger>
                <TabsTrigger value="motoristas" className="text-xs">
                  Motoristas
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="rounded-md bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground">
              Broadcast e tags · em breve
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma conversa
              </div>
            )}
            {filtered.map((c) => {
              const isActive = selected === c.user.id;
              const color =
                c.user.type === "empresa" ? "bg-[hsl(var(--company))]" : "bg-[hsl(var(--driver))]";
              return (
                <button
                  key={c.user.id}
                  onClick={() => {
                    setSelected(c.user.id);
                    setMobileChat(true);
                  }}
                  className={`w-full text-left px-3 py-3 flex gap-3 border-b hover:bg-accent transition-colors ${
                    isActive ? "bg-accent" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white shrink-0 ${color}`}
                  >
                    {c.user.name
                      .split(" ")
                      .slice(0, 2)
                      .map((s) => s[0])
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium truncate text-sm">{c.user.name}</div>
                      <div className="text-[10px] text-muted-foreground shrink-0">
                        {timeAgo(c.lastMessage?.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground truncate">
                        <span className="uppercase tracking-wide mr-1">{c.user.number}</span>
                        {c.lastMessage?.body || "Sem mensagens"}
                      </div>
                      {c.unreadForAdmin > 0 && (
                        <span className="ml-auto text-[10px] rounded-full bg-primary text-primary-foreground px-2 py-0.5 shrink-0">
                          {c.unreadForAdmin}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat */}
        <section className={`${mobileChat ? "flex" : "hidden"} md:flex flex-1 min-w-0 flex-col`}>
          {selectedUser ? (
            <>
              <div className="md:hidden border-b bg-card">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileChat(false)}
                  className="m-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <ChatWindow me={user} other={selectedUser} viewer="admin" />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Selecione uma conversa para começar
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={`text-lg font-semibold ${highlight ? "text-primary" : ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
