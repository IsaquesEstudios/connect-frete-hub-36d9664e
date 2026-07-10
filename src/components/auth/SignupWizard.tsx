import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Upload, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { formatDoc, docPlaceholder, docDigitsValid } from "@/lib/format-doc";

import { signup } from "@/lib/auth/session";
import type { User } from "@/lib/data";
import {
  CARROCERIAS,
  TIPOS_VEICULO,
  citiesByUF,
  listUFs,
  loadMunicipios,
  searchMunicipiosByName,
  statesForCityName,
  type Municipio,
} from "@/lib/br-locations";

type Kind = "empresa" | "motorista";

interface WizardData {
  kind: Kind | null;
  // Sec 1 (compartilhado)
  nome: string;
  documentoTipo: "cnpj" | "cpf";
  documento: string;
  whatsapp: string;
  email: string;
  senha: string;
  // Sec 1 (empresa)
  nomeFantasia: string;
  // Sec 2
  fotoUrl: string;
  // Sec 3 (empresa)
  perfilEmpresa: "transportador" | "embarcador" | "agenciador" | "";
  // Sec 3/4 – Local
  cidade: string;
  estado: string;
  // Motorista
  placa: string;
  tipoVeiculo: string;
  tipoVeiculoObs: string;
  rntrc: string;
  carroceria: string;
  carroceriaObs: string;
  // Redes sociais
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  redeOutros: string;
}

const initial: WizardData = {
  kind: null,
  nome: "",
  documentoTipo: "cnpj",
  documento: "",
  whatsapp: "",
  email: "",
  senha: "",
  nomeFantasia: "",
  fotoUrl: "",
  perfilEmpresa: "",
  cidade: "",
  estado: "",
  placa: "",
  tipoVeiculo: "",
  tipoVeiculoObs: "",
  rntrc: "",
  carroceria: "",
  carroceriaObs: "",
  instagram: "",
  facebook: "",
  youtube: "",
  tiktok: "",
  redeOutros: "",
};

export function SignupWizard({
  onDone,
  onBackToLogin,
}: {
  onDone: (u: User) => void;
  onBackToLogin: () => void;
}) {
  const [data, setData] = useState<WizardData>(initial);
  const [step, setStep] = useState(0); // 0 = pick kind; 1..N sections
  const [loading, setLoading] = useState(false);

  const isEmpresa = data.kind === "empresa";
  const totalSteps = isEmpresa ? 5 : 8;

  const update = <K extends keyof WizardData>(k: K, v: WizardData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const canAdvance = (): boolean => {
    if (step === 0) return data.kind !== null;

    if (isEmpresa) {
      if (step === 1)
        return (
          /\S+@\S+\.\S+/.test(data.email) &&
          data.senha.length >= 6 &&
          docDigitsValid(data.documento, data.documentoTipo) &&
          data.nomeFantasia.trim().length > 1 &&
          data.whatsapp.trim().length >= 8
        );
      if (step === 2) return true; // foto opcional
      if (step === 3) return !!data.perfilEmpresa;
      if (step === 4) return !!data.estado && !!data.cidade;
      if (step === 5) return true; // redes sociais opcional
      return true;
    }

    // Motorista
    if (step === 1)
      return (
        data.nome.trim().length > 1 &&
        docDigitsValid(data.documento, data.documentoTipo) &&
        data.whatsapp.trim().length >= 8 &&
        /\S+@\S+\.\S+/.test(data.email) &&
        data.senha.length >= 6
      );

    if (step === 2) return true;
    if (step === 3) return !!data.cidade && !!data.estado;
    if (step === 4) return data.placa.trim().length >= 5;
    if (step === 5) return !!data.tipoVeiculo;
    if (step === 6) return data.rntrc.trim().length >= 4;
    if (step === 7) return !!data.carroceria;
    if (step === 8) return true; // redes sociais opcional
    return true;
  };

  const submit = async () => {
    setLoading(true);
    try {
      const redes: Record<string, string> = {};
      if (data.instagram.trim()) redes.instagram = data.instagram.trim();
      if (data.facebook.trim()) redes.facebook = data.facebook.trim();
      if (data.youtube.trim()) redes.youtube = data.youtube.trim();
      if (data.tiktok.trim()) redes.tiktok = data.tiktok.trim();
      if (data.redeOutros.trim()) redes.outros = data.redeOutros.trim();
      const redesStr = Object.keys(redes).length ? JSON.stringify(redes) : undefined;

      const carroceriaFinal = !isEmpresa && data.carroceria
        ? data.carroceriaObs.trim()
          ? `${data.carroceria} | Obs: ${data.carroceriaObs.trim()}`
          : data.carroceria
        : undefined;
      const veiculoFinal = !isEmpresa && data.tipoVeiculo
        ? data.tipoVeiculoObs.trim()
          ? `${data.tipoVeiculo} | Obs: ${data.tipoVeiculoObs.trim()}`
          : data.tipoVeiculo
        : undefined;

      const u = await signup({
        email: data.email,
        password: data.senha,
        name: isEmpresa ? data.nomeFantasia.trim() : data.nome.trim(),
        type: data.kind as Kind,
        documentoTipo: data.documentoTipo,
        cnpj: data.documentoTipo === "cnpj" ? data.documento : undefined,
        cpf: data.documentoTipo === "cpf" ? data.documento : undefined,

        whatsapp: data.whatsapp,
        fotoUrl: data.fotoUrl || undefined,
        cidade: data.cidade || undefined,
        estado: data.estado || undefined,
        placa: !isEmpresa ? data.placa : undefined,
        veiculo: veiculoFinal,
        tipoVeiculo: veiculoFinal,
        rntrc: !isEmpresa ? data.rntrc : undefined,
        carroceria: carroceriaFinal,
        nomeFantasia: isEmpresa ? data.nomeFantasia.trim() : undefined,
        perfilEmpresa: isEmpresa && data.perfilEmpresa ? data.perfilEmpresa : undefined,
        siteRedeSocial: redesStr,
      });
      toast.success(`Cadastro criado: ${u.number}`);
      onDone(u);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (!canAdvance()) return;
    if (step === totalSteps) return void submit();
    setStep((s) => s + 1);
  };
  const back = () => {
    if (step === 0) return onBackToLogin();
    setStep((s) => s - 1);
  };

  return (
    <div className="space-y-5">
      {step > 0 && <ProgressBar current={step} total={totalSteps} />}

      {step === 0 && <StepKind data={data} update={update} />}

      {isEmpresa && step === 1 && <StepBasicEmpresa data={data} update={update} />}
      {isEmpresa && step === 2 && <StepFoto data={data} update={update} />}
      {isEmpresa && step === 3 && <StepDetalhesEmpresa data={data} update={update} />}
      {isEmpresa && step === 4 && <StepLocalByEstado data={data} update={update} />}
      {isEmpresa && step === 5 && <StepRedesSociais data={data} update={update} />}

      {!isEmpresa && step === 1 && <StepBasic data={data} update={update} />}
      {!isEmpresa && step === 2 && <StepFoto data={data} update={update} />}
      {!isEmpresa && step === 3 && <StepLocal data={data} update={update} />}
      {!isEmpresa && step === 4 && <StepPlaca data={data} update={update} />}
      {!isEmpresa && step === 5 && <StepTipoVeiculo data={data} update={update} />}
      {!isEmpresa && step === 6 && <StepRntrc data={data} update={update} />}
      {!isEmpresa && step === 7 && <StepCarroceria data={data} update={update} />}
      {!isEmpresa && step === 8 && <StepRedesSociais data={data} update={update} />}

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={back}
          className="text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {step === 0 ? "Voltar ao login" : "Voltar"}
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          onClick={next}
          disabled={!canAdvance() || loading}
          className="rounded-2xl bg-gradient-to-b from-sky-300 to-sky-500 text-slate-900 hover:from-sky-200 hover:to-sky-400"
        >
          {step === totalSteps ? (
            loading ? (
              "Criando..."
            ) : (
              <>
                <Check className="mr-1 h-4 w-4" /> Finalizar cadastro
              </>
            )
          ) : (
            <>
              Próximo <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wider text-slate-400">
        <span>
          Etapa {current} de {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-sky-300 to-sky-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// -------- STEPS --------

type StepProps = {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
};

function StepKind({ data, update }: StepProps) {
  const opts: { value: Kind; label: string; desc: string }[] = [
    { value: "empresa", label: "Empresa, Agência de carga ou Transportadora", desc: "Quero contratar fretes" },
    { value: "motorista", label: "Motorista", desc: "Quero receber cargas" },
  ];
  return (
    <div className="space-y-3">
      <h2 className="text-center text-sm uppercase tracking-wider text-slate-400">
        Como você quer se cadastrar?
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {opts.map((o) => {
          const active = data.kind === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => update("kind", o.value)}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                active
                  ? "border-sky-300/60 bg-sky-400/10 ring-1 ring-sky-300/30"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
              )}
            >
              <div className="text-base font-medium text-white">{o.label}</div>
              <div className="text-xs text-slate-400">{o.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const fieldWrap =
  "group rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 focus-within:border-sky-300/50 focus-within:bg-white/[0.06] transition";
const fieldLabel = "text-[11px] uppercase tracking-wider text-slate-400";
const fieldInput =
  "w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-6";

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className={fieldWrap}>
      <div className={fieldLabel}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </div>
      {children}
      {required && <div className="text-[10px] text-red-500 mt-0.5">obrigatório</div>}
    </div>
  );
}


function StepBasic({ data, update }: StepProps) {
  return (
    <div className="space-y-3">
      <Field required label="Nome completo">
        <Input
          value={data.nome}
          onChange={(e) => update("nome", e.target.value)}
          placeholder="Seu nome"
          className={fieldInput}
        />
      </Field>
      <div className={fieldWrap}>
        <div className={fieldLabel}>Tipo de documento<span className="ml-1 text-red-500">*</span></div>
        <RadioGroup
          value={data.documentoTipo}
          onValueChange={(v) => { update("documentoTipo", v as "cnpj" | "cpf"); update("documento", ""); }}
          className="mt-1 flex gap-4"
        >
          <label className="flex items-center gap-2 text-sm text-white">
            <RadioGroupItem value="cnpj" className="border-white/40 text-sky-300" />
            CNPJ
          </label>
          <label className="flex items-center gap-2 text-sm text-white">
            <RadioGroupItem value="cpf" className="border-white/40 text-sky-300" />
            CPF
          </label>
        </RadioGroup>
      </div>
      <Field required label={data.documentoTipo === "cnpj" ? "CNPJ" : "CPF"}>
        <Input
          value={data.documento}
          onChange={(e) => update("documento", formatDoc(e.target.value, data.documentoTipo))}
          placeholder={docPlaceholder(data.documentoTipo)}
          inputMode="numeric"
          className={fieldInput}
        />
      </Field>

      <Field required label="Whatsapp">
        <Input
          required
          value={data.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value)}
          placeholder="(11) 90000-0000"
          className={fieldInput}
        />
      </Field>
      <Field required label="Email">
        <Input
          required
          type="email"
          value={data.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="voce@exemplo.com"
          className={fieldInput}
        />
      </Field>
      <Field required label="Senha (mín. 6)">
        <Input
          type="password"
          minLength={6}
          value={data.senha}
          onChange={(e) => update("senha", e.target.value)}
          placeholder="••••••••"
          className={fieldInput}
        />
      </Field>
    </div>
  );
}

function StepFoto({ data, update }: StepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Foto muito grande. Máx. 5MB.");
      return;
    }
    // resize to max 512x512 and encode as jpeg dataURL to keep payload small.
    const bmp = await createImageBitmap(file);
    const size = 512;
    const scale = Math.min(1, size / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(bmp, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    update("fotoUrl", dataUrl);
  };

  return (
    <div className="space-y-3 text-center">
      <h2 className="text-sm uppercase tracking-wider text-slate-400">Foto de perfil</h2>
      <div className="flex justify-center">
        <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
          {data.fotoUrl ? (
            <img src={data.fotoUrl} alt="Prévia" className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="h-12 w-12 text-slate-500" />
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
        }}
      />
      <div className="flex justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {data.fotoUrl ? "Trocar foto" : "Enviar foto"}
        </Button>
        {data.fotoUrl && (
          <Button
            type="button"
            variant="ghost"
            className="text-slate-300 hover:bg-white/5 hover:text-white"
            onClick={() => update("fotoUrl", "")}
          >
            Remover
          </Button>
        )}
      </div>
      <p className="text-xs text-slate-500">Opcional. Você pode adicionar depois.</p>
    </div>
  );
}

function StepLocal({ data, update }: StepProps) {
  const [all, setAll] = useState<Municipio[] | null>(null);
  const [query, setQuery] = useState(data.cidade);
  const [openSug, setOpenSug] = useState(false);

  useEffect(() => {
    void loadMunicipios()
      .then(setAll)
      .catch(() => toast.error("Falha ao carregar cidades do IBGE."));
  }, []);

  const suggestions = useMemo(() => {
    if (!all) return [];
    return searchMunicipiosByName(all, query, 30);
  }, [all, query]);

  const availableStates = useMemo(() => {
    if (!all || !data.cidade) return [];
    return statesForCityName(all, data.cidade);
  }, [all, data.cidade]);

  const pickCity = (name: string) => {
    update("cidade", name);
    setQuery(name);
    setOpenSug(false);
    if (!all) return;
    const s = statesForCityName(all, name);
    // se só existe em um estado, já seleciona
    if (s.length === 1) update("estado", s[0].uf);
    else update("estado", "");
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Field label="Cidade">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpenSug(true);
              if (data.cidade && e.target.value !== data.cidade) {
                update("cidade", "");
                update("estado", "");
              }
            }}
            onFocus={() => setOpenSug(true)}
            placeholder={all ? "Digite o nome da cidade..." : "Carregando cidades..."}
            className={fieldInput}
          />
        </Field>
        {openSug && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-white/10 bg-[#0b1730] shadow-xl">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5"
                onClick={() => pickCity(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={cn(fieldWrap, !data.cidade && "opacity-50")}>
        <Label className={fieldLabel}>Estado<span className="ml-1 text-red-500">*</span></Label>
        <Select
          value={data.estado}
          onValueChange={(v) => update("estado", v)}
          disabled={!data.cidade}
        >
          <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-sm text-white shadow-none focus:ring-0">
            <SelectValue placeholder={data.cidade ? "Selecione o estado" : "Selecione a cidade primeiro"} />
          </SelectTrigger>
          <SelectContent>
            {availableStates.map((s) => (
              <SelectItem key={s.uf} value={s.uf}>
                {s.uf} — {s.ufNome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function StepPlaca({ data, update }: StepProps) {
  return (
    <div className="space-y-3">
      <Field required label="Placa do veículo">
        <Input
          value={data.placa}
          onChange={(e) => update("placa", e.target.value.toUpperCase())}
          placeholder="ABC1D23"
          className={fieldInput}
        />
      </Field>
    </div>
  );
}

function GroupedSelect({
  label,
  value,
  onChange,
  groups,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  groups: { grupo: string; opcoes: string[] }[];
  placeholder: string;
}) {
  return (
    <div className={fieldWrap}>
      <Label className={fieldLabel}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-sm text-white shadow-none focus:ring-0">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {groups.map((g) => (
            <SelectGroup key={g.grupo}>
              <SelectLabel>{g.grupo}</SelectLabel>
              {g.opcoes.map((op) => (
                <SelectItem key={`${g.grupo}::${op}`} value={`${g.grupo} — ${op}`}>
                  {op}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StepTipoVeiculo({ data, update }: StepProps) {
  return (
    <div className="space-y-3">
      <GroupedSelect
        label="Tipo de veículo"
        value={data.tipoVeiculo}
        onChange={(v) => update("tipoVeiculo", v)}
        groups={TIPOS_VEICULO}
        placeholder="Selecione o tipo de veículo"
      />
      <Field label="Observações adicionais (opcional)">
        <Input
          value={data.tipoVeiculoObs}
          onChange={(e) => update("tipoVeiculoObs", e.target.value)}
          placeholder="Ex.: 2020, ar-condicionado, rastreador..."
          className={fieldInput}
        />
      </Field>
    </div>
  );
}

function StepRntrc({ data, update }: StepProps) {
  return (
    <Field required label="RNTRC do veículo">
      <Input
        value={data.rntrc}
        onChange={(e) => update("rntrc", e.target.value)}
        placeholder="Digite o RNTRC"
        className={fieldInput}
      />
    </Field>
  );
}

function StepCarroceria({ data, update }: StepProps) {
  return (
    <div className="space-y-3">
      <GroupedSelect
        label="Tipo de carroceria"
        value={data.carroceria}
        onChange={(v) => update("carroceria", v)}
        groups={CARROCERIAS}
        placeholder="Selecione a carroceria"
      />
      <Field label="Observações adicionais (opcional)">
        <Input
          value={data.carroceriaObs}
          onChange={(e) => update("carroceriaObs", e.target.value)}
          placeholder="Ex.: capacidade, portas laterais, lonas..."
          className={fieldInput}
        />
      </Field>
    </div>
  );
}

function StepRedesSociais({ data, update }: StepProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm uppercase tracking-wider text-slate-400">Redes sociais (opcional)</h2>
      <Field label="Instagram">
        <Input
          value={data.instagram}
          onChange={(e) => update("instagram", e.target.value)}
          placeholder="@perfil ou link"
          className={fieldInput}
        />
      </Field>
      <Field label="Facebook">
        <Input
          value={data.facebook}
          onChange={(e) => update("facebook", e.target.value)}
          placeholder="facebook.com/perfil"
          className={fieldInput}
        />
      </Field>
      <Field label="Youtube">
        <Input
          value={data.youtube}
          onChange={(e) => update("youtube", e.target.value)}
          placeholder="youtube.com/@canal"
          className={fieldInput}
        />
      </Field>
      <Field label="Tiktok">
        <Input
          value={data.tiktok}
          onChange={(e) => update("tiktok", e.target.value)}
          placeholder="@perfil"
          className={fieldInput}
        />
      </Field>
      <Field label="Outros">
        <Input
          value={data.redeOutros}
          onChange={(e) => update("redeOutros", e.target.value)}
          placeholder="Site ou outra rede"
          className={fieldInput}
        />
      </Field>
    </div>
  );
}

// ---------- EMPRESA STEPS ----------

function StepBasicEmpresa({ data, update }: StepProps) {
  return (
    <div className="space-y-3">
      <Field required label="Email">
        <Input
          required
          type="email"
          value={data.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="contato@empresa.com"
          className={fieldInput}
        />
      </Field>
      <Field required label="Senha (mín. 6)">
        <Input
          type="password"
          minLength={6}
          value={data.senha}
          onChange={(e) => update("senha", e.target.value)}
          placeholder="••••••••"
          className={fieldInput}
        />
      </Field>
      <div className={fieldWrap}>
        <div className={fieldLabel}>Tipo de documento<span className="ml-1 text-red-500">*</span></div>
        <RadioGroup
          value={data.documentoTipo}
          onValueChange={(v) => {
            update("documentoTipo", v as "cnpj" | "cpf");
            update("documento", "");
          }}
          className="mt-1 flex gap-4"
        >
          <label className="flex items-center gap-2 text-sm text-white">
            <RadioGroupItem value="cnpj" className="border-white/40 text-sky-300" />
            CNPJ
          </label>
          <label className="flex items-center gap-2 text-sm text-white">
            <RadioGroupItem value="cpf" className="border-white/40 text-sky-300" />
            CPF
          </label>
        </RadioGroup>
      </div>
      <Field required label={data.documentoTipo === "cnpj" ? "CNPJ" : "CPF"}>
        <Input
          value={data.documento}
          onChange={(e) => update("documento", formatDoc(e.target.value, data.documentoTipo))}
          placeholder={docPlaceholder(data.documentoTipo)}
          inputMode="numeric"
          className={fieldInput}
        />
      </Field>

      <Field required label="Nome fantasia">
        <Input
          value={data.nomeFantasia}
          onChange={(e) => update("nomeFantasia", e.target.value)}
          placeholder="Nome da empresa"
          className={fieldInput}
        />
      </Field>
      <Field required label="Whatsapp">
        <Input
          required
          value={data.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value)}
          placeholder="(11) 90000-0000"
          className={fieldInput}
        />
      </Field>
    </div>
  );
}

function StepDetalhesEmpresa({ data, update }: StepProps) {
  const opts: { value: "transportador" | "embarcador" | "agenciador"; label: string; desc: string }[] = [
    { value: "transportador", label: "Transportadora", desc: "Presta serviço de transporte" },
    { value: "embarcador", label: "Empresa", desc: "Precisa mover cargas próprias" },
    { value: "agenciador", label: "Agência de carga", desc: "Intermedia cargas e fretes" },
  ];
  return (
    <div className="space-y-3">
      <h2 className="text-sm uppercase tracking-wider text-slate-400">Perfil da empresa</h2>
      <div className="grid grid-cols-1 gap-2">
        {opts.map((o) => {
          const active = data.perfilEmpresa === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => update("perfilEmpresa", o.value)}
              className={cn(
                "rounded-2xl border p-3 text-left transition",
                active
                  ? "border-sky-300/60 bg-sky-400/10 ring-1 ring-sky-300/30"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
              )}
            >
              <div className="text-sm font-medium text-white">{o.label}</div>
              <div className="text-xs text-slate-400">{o.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepLocalByEstado({ data, update }: StepProps) {
  const [all, setAll] = useState<Municipio[] | null>(null);

  useEffect(() => {
    void loadMunicipios()
      .then(setAll)
      .catch(() => toast.error("Falha ao carregar cidades do IBGE."));
  }, []);

  const ufs = useMemo(() => (all ? listUFs(all) : []), [all]);
  const cidades = useMemo(
    () => (all && data.estado ? citiesByUF(all, data.estado) : []),
    [all, data.estado],
  );

  return (
    <div className="space-y-3">
      <div className={fieldWrap}>
        <Label className={fieldLabel}>Estado<span className="ml-1 text-red-500">*</span></Label>
        <Select
          value={data.estado}
          onValueChange={(v) => {
            update("estado", v);
            update("cidade", "");
          }}
          disabled={!all}
        >
          <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-sm text-white shadow-none focus:ring-0">
            <SelectValue placeholder={all ? "Selecione o estado" : "Carregando..."} />
          </SelectTrigger>
          <SelectContent>
            {ufs.map((s) => (
              <SelectItem key={s.uf} value={s.uf}>
                {s.uf} — {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn(fieldWrap, !data.estado && "opacity-50")}>
        <Label className={fieldLabel}>Cidade<span className="ml-1 text-red-500">*</span></Label>
        <Select
          value={data.cidade}
          onValueChange={(v) => update("cidade", v)}
          disabled={!data.estado}
        >
          <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-sm text-white shadow-none focus:ring-0">
            <SelectValue
              placeholder={data.estado ? "Selecione a cidade" : "Selecione o estado primeiro"}
            />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {cidades.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
