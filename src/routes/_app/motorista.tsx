import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppHeader } from "@/components/chat/AppHeader";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ADMIN_ID, repo } from "@/lib/data";
import { homeFor } from "@/lib/auth/session";
import { usePresenceHeartbeat } from "@/lib/hooks/useRepo";

export const Route = createFileRoute("/_app/motorista")({
  head: () => ({ meta: [{ title: "Motorista — ConectaFrete" }] }),
  component: MotoristaPanel,
});

function MotoristaPanel() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  usePresenceHeartbeat(user.id);

  useEffect(() => {
    if (user.type !== "motorista") navigate({ to: homeFor(user) as "/admin" });
  }, [user, navigate]);

  const admin = repo.getUser(ADMIN_ID);
  if (user.type !== "motorista" || !admin) return null;

  return (
    <div className="h-screen flex flex-col">
      <AppHeader user={user} accent="bg-[hsl(var(--driver))]" />
      <div className="flex-1 min-h-0">
        <ChatWindow me={user} other={admin} viewer="user" />
      </div>
    </div>
  );
}
