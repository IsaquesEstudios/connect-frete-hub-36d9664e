import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth/useAuth";
import { repo } from "@/lib/data";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppGate,
});

function AppGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  // Presence: keep this user marked online while mounted
  useEffect(() => {
    if (!user) return;
    repo.setPresence(user.id, true);
    return () => repo.setPresence(user.id, false);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }
  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar user={user} />
        <div className="flex-1 min-w-0 flex flex-col relative">
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}
