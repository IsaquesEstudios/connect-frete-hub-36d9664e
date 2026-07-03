import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { homeFor, login } from "@/lib/auth/session";
import { useAuth } from "@/lib/auth/useAuth";
import type { User } from "@/lib/data";
import { cn } from "@/lib/utils";
import { SignupWizard } from "@/components/auth/SignupWizard";


export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — ConectaFrete" },
      { name: "description", content: "Acesse o ConectaFrete com seu email e senha." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (!loading && user) navigate({ to: homeFor(user) as "/admin" });
  }, [user, loading, navigate]);

  const goHome = (u: User) => navigate({ to: homeFor(u) as "/admin" });

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050b1a] text-slate-100 flex items-center justify-center p-4">
      {/* Deep space background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #0f2447 0%, #071228 45%, #030814 100%)",
        }}
      />
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(148,197,255,0.35) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
      {/* Star sparkle */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-[18%] h-40 w-40 -translate-x-1/2 rounded-full bg-sky-400/30 blur-3xl" />
      </div>

      {/* Glass card */}
      <div className="relative w-full max-w-md">
        {/* Top glow line */}
        <div className="absolute -top-px left-1/2 h-px w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
        <div className="absolute -top-6 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full bg-sky-300/40 blur-2xl" />

        <div
          className="relative rounded-3xl border border-white/10 bg-white/[0.04] px-7 py-8 backdrop-blur-xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8)]"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {mode === "login" ? "Bem-vindo de volta" : "Criar sua conta"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {mode === "login"
                ? "Entre com seus dados para acessar."
                : "Preencha para começar no ConectaFrete."}
            </p>
          </div>

          {mode === "login" ? (
            <LoginForm onDone={goHome} />
          ) : (
            <SignupForm onDone={goHome} />
          )}

          <div className="mt-6 text-center text-sm text-slate-400">
            {mode === "login" ? (
              <>
                Não tem uma conta?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="font-medium text-sky-300 underline underline-offset-4 hover:text-sky-200"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-medium text-sky-300 underline underline-offset-4 hover:text-sky-200"
                >
                  Entrar
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © ConectaFrete
        </p>
      </div>
    </div>
  );
}

const fieldWrap =
  "group rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 focus-within:border-sky-300/50 focus-within:bg-white/[0.06] transition";
const fieldLabel = "text-[11px] uppercase tracking-wider text-slate-400";
const fieldInput =
  "w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-6";

function GlassField({
  label,
  children,
  action,
}: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn(fieldWrap, "flex items-center gap-3")}>
      <div className="flex-1 min-w-0">
        <div className={fieldLabel}>{label}</div>
        {children}
      </div>
      {action}
    </div>
  );
}

function SubmitArrow({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-sky-300 to-sky-500 text-slate-900 shadow-[0_6px_20px_-6px_rgba(56,189,248,0.7)] transition hover:from-sky-200 hover:to-sky-400 disabled:opacity-60"
      aria-label="Enviar"
    >
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function LoginForm({ onDone }: { onDone: (u: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const u = await login(email, password);
          toast.success(`Bem-vindo, ${u.name}`);
          onDone(u);
        } catch (err) {
          toast.error((err as Error).message);
        } finally {
          setLoading(false);
        }
      }}
    >
      <GlassField label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
          placeholder="voce@empresa.com"
          className={fieldInput}
        />
      </GlassField>
      <GlassField label="Senha" action={<SubmitArrow loading={loading} />}>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className={fieldInput}
        />
      </GlassField>

      <div className="pt-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] leading-relaxed text-slate-400">
        <div className="mb-1 font-medium text-slate-300">Contas de teste</div>
        <div>Admin: admin@conectafrete.com / admin123</div>
        <div>Empresas: empresa1@conectafrete.com / 123456</div>
        <div>Motoristas: motorista1@conectafrete.com / 123456</div>
      </div>
    </form>
  );
}

function SignupForm({ onDone }: { onDone: (u: User) => void }) {
  const [type, setType] = useState<UserType>("empresa");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [placa, setPlaca] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const u = await signup({
            email,
            password,
            name: name.trim(),
            type,
            cnpj: type === "empresa" ? cnpj || "00.000.000/0001-00" : undefined,
            placa: type === "motorista" ? placa || "XXX-0000" : undefined,
            veiculo: type === "motorista" ? veiculo || "Não informado" : undefined,
          });
          toast.success(`Cadastro criado: ${u.number}`);
          onDone(u);
        } catch (err) {
          toast.error((err as Error).message);
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className={cn(fieldWrap)}>
        <Label className={fieldLabel}>Tipo de conta</Label>
        <Select value={type} onValueChange={(v) => setType(v as UserType)}>
          <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-sm text-white shadow-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="empresa">Empresa</SelectItem>
            <SelectItem value="motorista">Motorista</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <GlassField label="Nome">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Seu nome"
          className={fieldInput}
        />
      </GlassField>
      <GlassField label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="voce@empresa.com"
          className={fieldInput}
        />
      </GlassField>
      <GlassField label="Senha (mín. 6)" action={<SubmitArrow loading={loading} />}>
        <Input
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className={fieldInput}
        />
      </GlassField>

      {type === "empresa" && (
        <GlassField label="CNPJ">
          <Input
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="00.000.000/0001-00"
            className={fieldInput}
          />
        </GlassField>
      )}
      {type === "motorista" && (
        <>
          <GlassField label="Placa">
            <Input
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              placeholder="ABC-1234"
              className={fieldInput}
            />
          </GlassField>
          <GlassField label="Veículo">
            <Input
              value={veiculo}
              onChange={(e) => setVeiculo(e.target.value)}
              placeholder="Modelo do veículo"
              className={fieldInput}
            />
          </GlassField>
        </>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-2xl bg-gradient-to-b from-sky-300 to-sky-500 text-slate-900 font-medium hover:from-sky-200 hover:to-sky-400"
      >
        {loading ? "Criando..." : "Criar conta e entrar"}
      </Button>
    </form>
  );
}
