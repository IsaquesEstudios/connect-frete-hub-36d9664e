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
import { currentUser, homeFor, login } from "@/lib/auth/session";
import { repo, type UserType } from "@/lib/data";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — ConectaFrete" },
      { name: "description", content: "Acesse o ConectaFrete com seu número de usuário." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const u = currentUser();
    if (u) navigate({ to: homeFor(u) as "/admin" });
  }, [navigate]);

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
              <LoginForm onDone={(u) => navigate({ to: homeFor(u) as "/admin" })} />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm onDone={(u) => navigate({ to: homeFor(u) as "/admin" })} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onDone }: { onDone: (u: ReturnType<typeof login>) => void }) {
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      className="space-y-4 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          const u = login(number, password);
          toast.success(`Bem-vindo, ${u.name}`);
          onDone(u);
        } catch (err) {
          toast.error((err as Error).message);
        }
      }}
    >
      <div>
        <Label htmlFor="num">Número de usuário</Label>
        <Input
          id="num"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="EMP-0001, MOT-0001 ou ADM-0001"
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
          placeholder="senha (mock: 123 / admin)"
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Entrar
      </Button>
      <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
        <div className="font-medium text-foreground">Contas de teste</div>
        <div>Admin: ADM-0001 / admin</div>
        <div>Empresas: EMP-0001..0005 / 123</div>
        <div>Motoristas: MOT-0001..0005 / 123</div>
      </div>
    </form>
  );
}

function SignupForm({ onDone }: { onDone: (u: ReturnType<typeof login>) => void }) {
  const [type, setType] = useState<UserType>("empresa");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [placa, setPlaca] = useState("");
  const [veiculo, setVeiculo] = useState("");

  return (
    <form
      className="space-y-4 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          if (!name.trim() || !password.trim()) throw new Error("Preencha os campos");
          const base = { type, name: name.trim(), password };
          const user =
            type === "empresa"
              ? repo.createUser({ ...base, type: "empresa", cnpj: cnpj || "00.000.000/0001-00" })
              : type === "motorista"
                ? repo.createUser({
                    ...base,
                    type: "motorista",
                    placa: placa || "XXX-0000",
                    veiculo: veiculo || "Não informado",
                  })
                : repo.createUser({ ...base, type: "admin" });
          const u = login(user.number, password);
          toast.success(`Cadastro criado: ${u.number}`);
          onDone(u);
        } catch (err) {
          toast.error((err as Error).message);
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
        <Label htmlFor="n">Nome</Label>
        <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="p">Senha</Label>
        <Input
          id="p"
          type="password"
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
      <Button type="submit" className="w-full">
        Criar conta e entrar
      </Button>
    </form>
  );
}
