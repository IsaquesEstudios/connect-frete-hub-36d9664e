import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Building2, MessageSquare, Truck, MailWarning } from "lucide-react";
import { repo } from "@/lib/data";
import { homeFor } from "@/lib/auth/session";
import { useAuth } from "@/lib/auth/useAuth";
import { useRepoVersion } from "@/lib/hooks/useRepo";

export const Route = createFileRoute("/_app/metricas")({
  head: () => ({ meta: [{ title: "Métricas — ConectaFrete" }] }),
  component: MetricsPage,
});

function MetricsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const v = useRepoVersion();

  useEffect(() => {
    if (user && user.type !== "admin") navigate({ to: homeFor(user) as "/admin" });
  }, [user, navigate]);

  const conversations = useMemo(() => repo.listConversations(), [v]);

  const stats = useMemo(() => {
    const empresas = conversations.filter((c) => c.user.type === "empresa").length;
    const motoristas = conversations.filter((c) => c.user.type === "motorista").length;
    const active = conversations.filter((c) => c.lastMessage).length;
    const unread = conversations.reduce((n, c) => n + c.unreadForAdmin, 0);
    return { empresas, motoristas, active, unread };
  }, [conversations]);

  if (!user || user.type !== "admin") return null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight">Métricas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral das conversas e usuários da plataforma.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            label="Empresas"
            value={stats.empresas}
            icon={<Building2 className="h-5 w-5" />}
            accent="bg-[hsl(var(--company))]"
          />
          <Card
            label="Motoristas"
            value={stats.motoristas}
            icon={<Truck className="h-5 w-5" />}
            accent="bg-[hsl(var(--driver))]"
          />
          <Card
            label="Conversas ativas"
            value={stats.active}
            icon={<MessageSquare className="h-5 w-5" />}
            accent="bg-primary"
          />
          <Card
            label="Não lidas"
            value={stats.unread}
            icon={<MailWarning className="h-5 w-5" />}
            accent="bg-primary"
            highlight={stats.unread > 0}
          />
        </div>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  icon,
  accent,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md text-white ${accent}`}>
          {icon}
        </div>
      </div>
      <div className={`mt-2 text-3xl font-semibold ${highlight ? "text-primary" : ""}`}>
        {value}
      </div>
    </div>
  );
}
