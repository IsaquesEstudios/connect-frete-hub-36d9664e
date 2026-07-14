import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/loose-client";
import { translateAuthError } from "@/lib/auth/translate-error";
import { PasswordInput } from "@/components/auth/PasswordInput";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Redefinir senha — ConectaFrete" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase entrega o token no hash da URL e cria uma sessão temporária.
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        toast.error("Link inválido ou expirado. Solicite um novo.");
        navigate({ to: "/auth" });
        return;
      }
      setReady(true);
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres.");
    if (password !== confirm) return toast.error("As senhas não coincidem.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso.");
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-[#050b1a] flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 space-y-5 text-white"
      >
        <div>
          <h1 className="text-xl font-semibold">Redefinir sua senha</h1>
          <p className="text-sm text-slate-400 mt-1">Escolha uma nova senha (mín. 6 caracteres).</p>
        </div>
        <div className="space-y-2">
          <Label>Nova senha</Label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputClassName="bg-white/[0.05] border-white/10 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label>Confirmar senha</Label>
          <PasswordInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            inputClassName="bg-white/[0.05] border-white/10 text-white"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  );
}
