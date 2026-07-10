import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Building2, Download, MessageSquare, Truck, MailWarning, Tags, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { repo } from "@/lib/data";
import { homeFor } from "@/lib/auth/session";
import { useAuth } from "@/lib/auth/useAuth";
import { useRepoVersion } from "@/lib/hooks/useRepo";

export const Route = createFileRoute("/_app/metricas")({
  head: () => ({ meta: [{ title: "Métricas — ConectaFrete" }] }),
  component: MetricsPage,
});

function MetricsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const v = useRepoVersion();

  useEffect(() => {
    if (user && user.type !== "admin") navigate({ to: homeFor(user) as "/admin" });
  }, [user, navigate]);

  const conversations = useMemo(() => repo.listConversations(), [v]);
  const tags = useMemo(() => repo.listTags(), [v]);

  const stats = useMemo(() => {
    const empresas = conversations.filter((c) => c.user.type === "empresa").length;
    const motoristas = conversations.filter((c) => c.user.type === "motorista").length;
    const active = conversations.filter((c) => c.lastMessage).length;
    const unread = conversations.reduce((n, c) => n + c.unreadForAdmin, 0);
    return { empresas, motoristas, active, unread, tags: tags.length };
  }, [conversations, tags]);

  const tagReport = useMemo(
    () =>
      tags.map((tag) => {
        const taggedConversations = conversations.filter((c) => c.tagIds.includes(tag.id));
        return {
          tag,
          total: taggedConversations.length,
          empresas: taggedConversations.filter((c) => c.user.type === "empresa").length,
          motoristas: taggedConversations.filter((c) => c.user.type === "motorista").length,
        };
      }),
    [conversations, tags],
  );

  if (!user || user.type !== "admin") return null;

  function csvEscape(v: string | number) {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function downloadReport() {
    const lines: string[] = [];
    lines.push("Relatório ConectaFrete");
    lines.push(`Gerado em;${new Date().toLocaleString()}`);
    lines.push("");
    lines.push("Resumo");
    lines.push("Métrica;Valor");
    lines.push(`Empresas;${stats.empresas}`);
    lines.push(`Motoristas;${stats.motoristas}`);
    lines.push(`Conversas ativas;${stats.active}`);
    lines.push(`Não lidas;${stats.unread}`);
    lines.push(`Tags cadastradas;${stats.tags}`);
    lines.push("");
    lines.push("Tags");
    lines.push("Tag;Cor;Conversas;Empresas;Motoristas");
    for (const r of tagReport) {
      lines.push(
        [r.tag.label, r.tag.color, r.total, r.empresas, r.motoristas].map(csvEscape).join(";"),
      );
    }
    lines.push("");
    lines.push("Conversas");
    lines.push("Nome;Tipo;Número;Não lidas admin;Última mensagem;Tags");
    for (const c of conversations) {
      const tagLabels = c.tagIds.join("|");
      const last = c.lastMessage ? new Date(c.lastMessage.createdAt).toLocaleString() : "";
      lines.push(
        [c.user.name, c.user.type, c.user.number, c.unreadForAdmin, last, tagLabels]
          .map(csvEscape)
          .join(";"),
      );
    }
    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-conectafrete-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadPDF() {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = conversations
      .map(
        (c) =>
          `<tr><td>${escapeHtml(c.user.name)}</td><td>${escapeHtml(c.user.number)}</td><td>${escapeHtml((c.user as { email?: string }).email ?? "")}</td><td>${escapeHtml(c.user.type)}</td><td>${c.unreadForAdmin}</td><td>${c.tagIds.map((id) => escapeHtml(id)).join(", ")}</td></tr>`,
      )
      .join("");
    const tagRows = tagReport
      .map(
        (r) =>
          `<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${r.tag.color};margin-right:6px"></span>${escapeHtml(r.tag.label)}</td><td>${r.total}</td><td>${r.empresas}</td><td>${r.motoristas}</td></tr>`,
      )
      .join("");
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Relatório ConectaFrete</title>
<style>
body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:32px;color:#111}
h1{margin:0 0 4px;font-size:22px}
.sub{color:#666;font-size:12px;margin-bottom:24px}
h2{font-size:16px;margin:24px 0 8px}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
th{background:#f3f4f6}
.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px}
.card{border:1px solid #ddd;border-radius:6px;padding:8px}
.card b{display:block;font-size:20px}.card span{font-size:11px;color:#666;text-transform:uppercase}
</style></head><body>
<h1>Relatório ConectaFrete</h1>
<div class="sub">Gerado em ${new Date().toLocaleString()}</div>
<div class="cards">
<div class="card"><span>Empresas</span><b>${stats.empresas}</b></div>
<div class="card"><span>Motoristas</span><b>${stats.motoristas}</b></div>
<div class="card"><span>Ativas</span><b>${stats.active}</b></div>
<div class="card"><span>Não lidas</span><b>${stats.unread}</b></div>
<div class="card"><span>Tags</span><b>${stats.tags}</b></div>
</div>
<h2>Tags</h2>
<table><thead><tr><th>Tag</th><th>Conversas</th><th>Empresas</th><th>Motoristas</th></tr></thead><tbody>${tagRows || '<tr><td colspan="4">Nenhuma tag.</td></tr>'}</tbody></table>
<h2>Conversas</h2>
<table><thead><tr><th>Nome</th><th>Número</th><th>Email</th><th>Tipo</th><th>Não lidas</th><th>Tags</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Nenhuma conversa.</td></tr>'}</tbody></table>
<script>window.onload=()=>{window.print()}</script>
</body></html>`);
    win.document.close();
  }

  function escapeHtml(s: string) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Métricas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Visão geral das conversas e usuários da plataforma.
            </p>
          </div>
          <Button onClick={downloadReport} className="shrink-0">
            <Download className="h-4 w-4 mr-2" /> Gerar relatório
          </Button>
        </div>


        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            label="Empresas"
            value={stats.empresas}
            icon={<Building2 className="h-5 w-5" />}
            accent="bg-[hsl(var(--company))]"
          />
          <Card
            label="Motoristas"
            value={stats.motoristas}
            icon={<Truck className="h-5 w-5" />}
            accent="bg-[hsl(var(--driver))]"
          />
          <Card
            label="Conversas ativas"
            value={stats.active}
            icon={<MessageSquare className="h-5 w-5" />}
            accent="bg-primary"
          />
          <Card
            label="Não lidas"
            value={stats.unread}
            icon={<MailWarning className="h-5 w-5" />}
            accent="bg-primary"
            highlight={stats.unread > 0}
          />
          <Card
            label="Tags cadastradas"
            value={stats.tags}
            icon={<Tags className="h-5 w-5" />}
            accent="bg-primary"
          />
        </div>

        <section className="mt-6 rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Relatório de tags</h2>
          </div>
          {tagReport.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhuma tag cadastrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Tag</th>
                    <th className="px-4 py-3 font-medium">Cor</th>
                    <th className="px-4 py-3 font-medium">Conversas</th>
                    <th className="px-4 py-3 font-medium">Empresas</th>
                    <th className="px-4 py-3 font-medium">Motoristas</th>
                  </tr>
                </thead>
                <tbody>
                  {tagReport.map(({ tag, total, empresas, motoristas }) => (
                    <tr key={tag.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{tag.label}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className="h-4 w-4 rounded-full border"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.color}
                        </span>
                      </td>
                      <td className="px-4 py-3">{total}</td>
                      <td className="px-4 py-3">{empresas}</td>
                      <td className="px-4 py-3">{motoristas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  icon,
  accent,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md text-white ${accent}`}>
          {icon}
        </div>
      </div>
      <div className={`mt-2 text-3xl font-semibold ${highlight ? "text-primary" : ""}`}>
        {value}
      </div>
    </div>
  );
}
