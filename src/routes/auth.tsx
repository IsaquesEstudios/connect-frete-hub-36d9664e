import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { homeFor, login, signup } from "@/lib/auth/session";
import { useAuth } from "@/lib/auth/useAuth";
import type { User, UserType } from "@/lib/data";

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

  useEffect(() => {
    if (!loading && user) navigate({ to: homeFor(user) as "/admin" });
  }, [user, loading, navigate]);

  const goHome = (u: User) => navigate({ to: homeFor(u) as "/admin" });

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-primary text-primary-foreground">
        <div className="text-2xl font-semibold tracking-tight">ConectaFrete</div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold leading-tight">
            Central de comunicação para empresas e motoristas.
          </h1>
          <p className="text-primary-foreground/80 max-w-md">
            Todas as conversas passam pelo Admin — atendimento centralizado, organizado e
            rastreável.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/60">© ConectaFrete</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden text-center">
            <h1 className="text-2xl font-bold">ConectaFrete</h1>
          </div>
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onDone={goHome} />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm onDone={goHome} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onDone }: { onDone: (u: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-4 pt-4"
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
      <div>
        <Label htmlFor="em">Email</Label>
        <Input
          id="em"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div>
        <Label htmlFor="pw">Senha</Label>
        <Input
          id="pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
      <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
        <div className="font-medium text-foreground">Contas de teste (seed)</div>
        <div>Admin: admin@conectafrete.com / admin123</div>
        <div>Empresas: empresa1@conectafrete.com, empresa2@... / 123456</div>
        <div>Motoristas: motorista1@conectafrete.com, motorista2@... / 123456</div>
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
      className="space-y-4 pt-4"
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
      <div>
        <Label>Tipo de conta</Label>
        <Select value={type} onValueChange={(v) => setType(v as UserType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="empresa">Empresa</SelectItem>
            <SelectItem value="motorista">Motorista</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="em">Email</Label>
        <Input
          id="em"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="n">Nome</Label>
        <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="p">Senha (mín. 6)</Label>
        <Input
          id="p"
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {type === "empresa" && (
        <div>
          <Label htmlFor="c">CNPJ</Label>
          <Input id="c" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
        </div>
      )}
      {type === "motorista" && (
        <>
          <div>
            <Label htmlFor="pl">Placa</Label>
            <Input id="pl" value={placa} onChange={(e) => setPlaca(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="v">Veículo</Label>
            <Input id="v" value={veiculo} onChange={(e) => setVeiculo(e.target.value)} />
          </div>
        </>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando..." : "Criar conta e entrar"}
      </Button>
    </form>
  );
}
