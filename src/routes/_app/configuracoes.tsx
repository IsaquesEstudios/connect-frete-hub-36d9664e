import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getWhatsappLinks, updateWhatsappLinks } from "@/lib/data/app-settings.functions";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — SV Logística" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [motoristas, setMotoristas] = useState("");
  const [empresas, setEmpresas] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.type === "admin";

  useEffect(() => {
    let alive = true;
    getWhatsappLinks()
      .then((r) => {
        if (!alive) return;
        setMotoristas(r.motoristas);
        setEmpresas(r.empresas);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (!user) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateWhatsappLinks({ data: { motoristas, empresas } });
      toast.success("Links atualizados com sucesso.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajuste preferências gerais do sistema.
          </p>
        </div>

        {isAdmin ? (
          <form onSubmit={handleSave} className="rounded-lg border bg-card p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold">Links das comunidades no WhatsApp</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Estes links são exibidos nos botões da página inicial.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motoristas">Botão de motoristas</Label>
              <Input
                id="motoristas"
                type="url"
                placeholder="https://chat.whatsapp.com/..."
                value={motoristas}
                onChange={(e) => setMotoristas(e.target.value)}
                disabled={loading || saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresas">Botão de empresas</Label>
              <Input
                id="empresas"
                type="url"
                placeholder="https://chat.whatsapp.com/..."
                value={empresas}
                onChange={(e) => setEmpresas(e.target.value)}
                disabled={loading || saving}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading || saving}>
                {saving ? "Salvando…" : "Salvar alterações"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Em breve: preferências de notificação, tema e mais.
          </p>
        )}
      </div>
    </div>
  );
}
