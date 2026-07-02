import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppHeader } from "@/components/chat/AppHeader";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ADMIN_ID, repo } from "@/lib/data";
import { homeFor } from "@/lib/auth/session";
import { useAuth } from "@/lib/auth/useAuth";
import { useRepoVersion } from "@/lib/hooks/useRepo";

export const Route = createFileRoute("/_app/empresa")({
  head: () => ({ meta: [{ title: "Empresa — ConectaFrete" }] }),
  component: EmpresaPanel,
});

function EmpresaPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const v = useRepoVersion();

  useEffect(() => {
    if (user && user.type !== "empresa") navigate({ to: homeFor(user) as "/admin" });
  }, [user, navigate]);

  if (!user || user.type !== "empresa") return null;
  const admin = repo.getUser(ADMIN_ID);
  void v;
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando central...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <AppHeader user={user} accent="bg-[hsl(var(--company))]" />
      <div className="flex-1 min-h-0">
        <ChatWindow me={user} other={admin} viewer="user" />
      </div>
    </div>
  );
}
