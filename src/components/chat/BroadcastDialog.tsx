import { useMemo, useState } from "react";
import { History, Megaphone, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { repo } from "@/lib/data";
import type { BroadcastAudience } from "@/lib/data/repository";
import { useRepoVersion } from "@/lib/hooks/useRepo";

type AudienceKind = "all" | "empresas" | "motoristas" | "tag";

function audienceLabel(kind: AudienceKind, tagLabel?: string) {
  if (kind === "all") return "Todos os usuários";
  if (kind === "empresas") return "Somente Empresas";
  if (kind === "motoristas") return "Somente Motoristas";
  return `Tag: ${tagLabel ?? "—"}`;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s atrás`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export function BroadcastDialog({
  trigger,
  adminId,
}: {
  trigger: React.ReactNode;
  adminId: string;
}) {
  const v = useRepoVersion();
  const tags = useMemo(() => repo.listTags(), [v]);
  const broadcasts = useMemo(() => repo.listBroadcasts(), [v]);
  const tagsById = useMemo(
    () => Object.fromEntries(tags.map((t) => [t.id, t] as const)),
    [tags],
  );

  const [kind, setKind] = useState<AudienceKind>("all");
  const [tagId, setTagId] = useState<string>("");
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"compose" | "history">("compose");

  const audience: BroadcastAudience | null =
    kind === "tag"
      ? tagId
        ? { kind: "tag", tagId }
        : null
      : { kind };

  const recipients = audience ? repo.resolveBroadcastRecipients(audience) : [];

  const send = () => {
    if (!audience) {
      toast.error("Selecione uma tag.");
      return;
    }
    if (!body.trim()) return;
    if (recipients.length === 0) {
      toast.error("Nenhum destinatário para essa seleção.");
      return;
    }
    repo.sendBroadcast({ body: body.trim(), audience, fromUserId: adminId });
    toast.success(`Broadcast enviado para ${recipients.length} usuário(s).`);
    setBody("");
    setTab("history");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Mensagem em massa
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b">
          <button
            className={`px-3 py-1.5 text-xs border-b-2 ${
              tab === "compose"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
            onClick={() => setTab("compose")}
          >
            Nova
          </button>
          <button
            className={`px-3 py-1.5 text-xs border-b-2 flex items-center gap-1 ${
              tab === "history"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
            onClick={() => setTab("history")}
          >
            <History className="h-3 w-3" /> Histórico ({broadcasts.length})
          </button>
        </div>

        {tab === "compose" ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Destinatários</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as AudienceKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  <SelectItem value="empresas">Somente Empresas</SelectItem>
                  <SelectItem value="motoristas">Somente Motoristas</SelectItem>
                  <SelectItem value="tag" disabled={tags.length === 0}>
                    Por tag
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {kind === "tag" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Tag</Label>
                <Select value={tagId} onValueChange={setTagId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: t.color }}
                          />
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Mensagem</Label>
              <Textarea
                rows={5}
                placeholder="Digite a mensagem..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Será enviada para <strong className="text-foreground">{recipients.length}</strong>{" "}
              usuário(s).
            </div>

            <DialogFooter>
              <Button onClick={send} disabled={!body.trim() || recipients.length === 0}>
                <Send className="h-4 w-4 mr-1" /> Enviar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto -mx-1">
            {broadcasts.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma mensagem em massa enviada ainda.
              </div>
            )}
            <ul className="divide-y">
              {broadcasts.map((b) => (
                <li key={b.id} className="px-2 py-3">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span>
                      {audienceLabel(
                        b.audience as AudienceKind,
                        b.tagId ? tagsById[b.tagId]?.label : undefined,
                      )}
                    </span>
                    <span>{timeAgo(b.sentAt)}</span>
                  </div>
                  <div className="text-sm mt-1 whitespace-pre-wrap">{b.body}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {b.recipientCount} destinatário(s)
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
