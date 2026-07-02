import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/useAuth";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — ConectaFrete" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Em breve: preferências de notificação, tema e mais.
        </p>
      </div>
    </div>
  );
}
